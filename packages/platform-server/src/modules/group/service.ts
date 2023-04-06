/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { Injectable, NotFoundException } from '@nestjs/common'
import { differenceBy } from 'lodash'
import { Brackets, In } from 'typeorm'

import {
  Group,
  User,
  Project,
  SnapshotReport,
  Artifact,
  ProjectGroup,
  DBService,
  Snapshot,
} from '@perfsee/platform-server/db'
import { UserError } from '@perfsee/platform-server/error'
import { PaginationInput } from '@perfsee/platform-server/graphql'
import { Logger } from '@perfsee/platform-server/logger'
import { Metric } from '@perfsee/platform-server/metrics'
import { createDataLoader } from '@perfsee/platform-server/utils'
import { SnapshotStatus } from '@perfsee/server-common'
import { MetricType } from '@perfsee/shared'

import { PermissionProvider, Permission } from '../permission'
import { UserService } from '../user'

import { CreateGroupInput } from './types'

@Injectable()
export class GroupService {
  loader = createDataLoader((ids: number[]) =>
    Group.findBy({
      id: In(ids),
    }),
  )

  constructor(
    private readonly permissionProvider: PermissionProvider,
    private readonly userService: UserService,
    private readonly metricService: Metric,
    private readonly logger: Logger,
    private readonly db: DBService,
  ) {}

  async resolveRawGroupIdBySlug(slug: string) {
    const group = await this.getGroup(slug)
    if (!group) {
      throw new NotFoundException('group not found')
    }

    return group.id
  }

  getGroupById(id: number) {
    return Group.findOneByOrFail({ id })
  }

  async getGroups(user: User, { first, skip, after }: PaginationInput, query?: string) {
    const queryBuilder = Group.createQueryBuilder('group')

    // only allow to query groups that the user can see
    const allowGroupIds = await this.permissionProvider.userAllowList(user, Permission.Read, true)
    if (allowGroupIds.length) {
      queryBuilder.andWhere(
        new Brackets((builder) => {
          builder.andWhereInIds(allowGroupIds)
        }),
      )
    } else {
      return [[], 0] as [Group[], number]
    }

    // fuzzy matching
    if (query) {
      queryBuilder
        .andWhere(
          new Brackets((subBuilder) => {
            subBuilder.where(`group.slug like :query`)
          }),
        )
        .setParameters({ query: `%${query}%` })
    }

    // ignore records before `after`
    if (after) {
      queryBuilder.andWhere('group.id > :after', { after })
    }

    return queryBuilder.orderBy('group.id', 'ASC').skip(skip).take(first).getManyAndCount()
  }

  async getGroupUsers(group: Group, permission: Permission) {
    const users = await this.permissionProvider.groupAllowList(group, permission)

    if (typeof users[0] === 'number') {
      return User.findBy({
        id: In(users),
      })
    } else {
      return User.findBy({
        email: In(users),
      })
    }
  }

  async getAuthorizedUsers(group: Group) {
    const owners = await this.getGroupUsers(group, Permission.Admin)
    const viewers = await this.getGroupUsers(group, Permission.Read)

    return [
      ...this.insertUserPermission(owners, Permission.Admin),
      ...this.insertUserPermission(
        viewers.filter((viewer) => owners.every((owner) => owner.email !== viewer.email)),
        Permission.Read,
      ),
    ]
  }

  async checkPermission(payload: { user: User; slug: string; permission: Permission }) {
    const { user, slug, permission } = payload

    const group = await this.getGroup(slug)
    if (!group) {
      return false
    }

    if (user.isAdmin) {
      return true
    }

    return this.permissionProvider.check(user, group.id, permission, true)
  }

  async addGroupOwner(groupId: number, email: string) {
    const [user] = await this.userService.findOrCreateByEmails([email])
    return this.permissionProvider.grant(user, groupId, Permission.Admin, true)
  }

  getGroup(slug: string) {
    return Group.createQueryBuilder('group').where('group.slug = :slug').setParameters({ slug }).getOne()
  }

  async updateGroupOwners(group: Group, owners: string[]) {
    const users = await this.userService.findOrCreateByEmails(owners)
    const old = await this.getGroupUsers(group, Permission.Admin)
    const removed = differenceBy(old, users, (user) => user.email)
    const added = differenceBy(users, old, (user) => user.email)

    await Promise.all([
      ...removed.map((user) => this.permissionProvider.revoke(user, group.id, Permission.Admin, true)),
      ...added.map((user) => this.permissionProvider.grant(user, group.id, Permission.Admin, true)),
    ])
  }

  async updateGroupUserPermission(groupId: number, email: string, permission: Permission, isAdd: boolean) {
    const user = await this.userService.findUserByEmail(email)

    if (!user) {
      throw new UserError('No such user')
    }

    const hasPermission = await this.permissionProvider.check(user, groupId, permission, true)

    if (isAdd && hasPermission) {
      throw new UserError('User already has this permission')
    } else if (!isAdd && !hasPermission) {
      throw new UserError('User do not has this permission')
    }

    if (isAdd) {
      await this.permissionProvider.grant(user, groupId, permission, true)
    } else {
      await this.permissionProvider.revoke(user, groupId, permission, true)
    }
  }

  async verifyNewSlug(newSlug: string): Promise<{ error?: string; ok: boolean }> {
    if (newSlug.length > 100) {
      return { error: 'Id is too long', ok: false }
    }
    if (newSlug.length < 3) {
      return { error: 'Id is too short', ok: false }
    }
    if (!/^[0-9a-z-_]+$/.test(newSlug)) {
      return {
        error: 'Invalid id, id should contains only lowercase letters "a-z", numbers "0-9", hyphen "-", underscore "_"',
        ok: false,
      }
    }
    const group = await Group.findOne({ where: { slug: newSlug } })
    if (group) {
      return { error: 'Id is unavailable', ok: false }
    }
    return { ok: true }
  }

  async create(user: User, input: CreateGroupInput) {
    const { id, projectIds } = input

    const slugVerification = await this.verifyNewSlug(id)

    if (!slugVerification.ok) {
      throw new UserError('Invalid id, ' + slugVerification.error)
    }

    if (projectIds.length > 8) {
      throw new UserError('Need less than 8 projects')
    }

    const projects = await Project.findBy({ slug: In(projectIds) })

    if (!projects.length) {
      throw new UserError('No such projects')
    }

    this.metricService.newGroup(1)

    return this.db.transaction(async (manager) => {
      const group = await manager.save(Group, { slug: id })

      const projectInGroupList = projects.map((project) => manager.create(ProjectGroup, { project, group }))
      await manager.save(projectInGroupList)

      await this.permissionProvider.onCreateGroup(group, [user], user)

      this.metricService.totalGroup(await Group.count())

      return group
    })
  }

  async updateGroupProject(groupId: number, projectSlug: string, isAdd: boolean) {
    const project = await Project.findOneBy({ slug: projectSlug })

    if (!project) {
      throw new UserError('No such project')
    }

    const existed = await ProjectGroup.findOneBy({ groupId, projectId: project.id })
    const projectGroupCount = await ProjectGroup.countBy({ groupId })

    if (!isAdd && existed) {
      if (projectGroupCount > 1) {
        await ProjectGroup.remove(existed)
      } else {
        throw new UserError('Need more than 1 project')
      }
    }

    if (isAdd && projectGroupCount > 7) {
      throw new UserError('Need less than 8 projects')
    }

    if (isAdd && !existed) {
      await ProjectGroup.save({ groupId, projectId: project.id })
    }

    return project
  }

  async getUserPermission(user: User, group: Group) {
    return this.permissionProvider.get(user, group.id, true)
  }

  async deleteGroup(groupId: number) {
    this.logger.log('start delete group', { groupId })
    await Group.delete({ id: groupId })

    return true
  }

  async findProjectsByGroupId(groupId: number) {
    const projectsInGroup = await ProjectGroup.findBy({ groupId: groupId })
    const projectIds = projectsInGroup.map((p) => p.projectId)
    return Project.findBy({ id: In(projectIds) })
  }

  async getArtifacts(from: Date, to: Date, project: Project, isBaseline?: boolean) {
    if (to < from) {
      throw Error('Invalid date range.')
    }

    const qb = Artifact.createQueryBuilder('artifact')
      .where('artifact.created_at between :from and :to', { from, to })
      .andWhere('artifact.project_id = :projectId', { projectId: project.id })
      .andWhere('artifact.score is not null')

    if (isBaseline) {
      qb.andWhere('artifact.is_baseline = true')
    }

    const oldest = await qb.getOne()
    const latest = await qb.orderBy('created_at', 'DESC').getOne()

    return latest?.id === oldest?.id ? [latest].filter(Boolean) : [oldest, latest].filter(Boolean)
  }

  async getSnapshots(from: Date, to: Date, project: Project) {
    if (to < from) {
      throw Error('Invalid date range.')
    }

    const qb = Snapshot.createQueryBuilder('snapshot')
      .where('snapshot.created_at between :from and :to', { from, to })
      .andWhere('snapshot.project_id = :projectId', { projectId: project.id })
      .andWhere('snapshot.status = :status', { status: SnapshotStatus.Completed })

    const oldest = await qb.getOne()
    const latest = await qb.orderBy('created_at', 'DESC').getOne()

    return latest?.id === oldest?.id ? [latest].filter(Boolean) : [oldest, latest].filter(Boolean)
  }

  async getBundleScores(from: Date, to: Date, project: Project) {
    if (to < from) {
      throw Error('Invalid date range.')
    }

    return Artifact.createQueryBuilder('artifact')
      .select('AVG(artifact.score)', 'averageScore')
      .addSelect('MAX(artifact.score)', 'maxScore')
      .addSelect('MIN(artifact.score)', 'minScore')
      .where('artifact.created_at between :from and :to', { from, to })
      .andWhere('artifact.project_id = :projectId', { projectId: project.id })
      .andWhere('artifact.score is not null')
      .getRawOne<{ averageScore: number; maxScore: number; minScore: number }>()
  }

  async getLabAvgMetrics(from: Date, to: Date, project: Project) {
    if (to < from) {
      throw Error('Invalid date range.')
    }

    const qb = SnapshotReport.createQueryBuilder('report')
      .select('AVG(report.performance_score)', 'score')
      .where('report.project_id = :projectId', { projectId: project.id })
      .andWhere('report.created_at between :from and :to', { from, to })
      .andWhere('report.performance_score is not null')
      .andWhere('report.performance_score != 0')

    Object.keys(MetricType).forEach((key) => {
      qb.addSelect(`AVG(JSON_EXTRACT(report.metrics, '$."${MetricType[key]}"'))`, key)
    })

    return qb.getRawOne<{ [key in MetricType | 'score']: number }>()
  }

  private insertUserPermission(users: User[], permission: Permission) {
    return users.map((user) => ({ ...user, permission }))
  }
}
