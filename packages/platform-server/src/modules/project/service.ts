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

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { differenceBy, isEmpty, isUndefined, omitBy } from 'lodash'
import { Brackets, In } from 'typeorm'

import { Config } from '@perfsee/platform-server/config'
import { Cron, CronExpression } from '@perfsee/platform-server/cron'
import {
  DBService,
  Environment,
  InternalIdUsage,
  Job,
  Profile,
  Project,
  UsagePack,
  Setting,
  User,
  UserStarredProject,
} from '@perfsee/platform-server/db'
import { mapInternalError, UserError } from '@perfsee/platform-server/error'
import { PaginationInput } from '@perfsee/platform-server/graphql'
import { InternalIdService } from '@perfsee/platform-server/helpers'
import { Logger } from '@perfsee/platform-server/logger'
import { Metric } from '@perfsee/platform-server/metrics'
import { JobLogStorage, ObjectStorage } from '@perfsee/platform-server/storage'
import { createDataLoader } from '@perfsee/platform-server/utils'
import { GitHost } from '@perfsee/shared'

import { ApplicationSettingService } from '../application-setting'
import { GithubService } from '../github'
import { PermissionProvider, Permission } from '../permission'
import { UserService } from '../user'

import { CreateProjectInput, UpdateProjectInput } from './types'

@Injectable()
export class ProjectService {
  loader = createDataLoader((ids: number[]) =>
    Project.findBy({
      id: In(ids),
    }),
  )

  slugLoader = createDataLoader(
    (slugs: string[]) =>
      Project.findBy({
        slug: In(slugs),
      }),
    'slug',
  )

  constructor(
    private readonly permissionProvider: PermissionProvider,
    private readonly github: GithubService,
    private readonly db: DBService,
    private readonly userService: UserService,
    private readonly metricService: Metric,
    private readonly internalIdService: InternalIdService,
    private readonly config: Config,
    private readonly logger: Logger,
    private readonly storage: ObjectStorage,
    private readonly logStorage: JobLogStorage,
    private readonly settings: ApplicationSettingService,
  ) {}

  async resolveRawProjectIdBySlug(slug: string) {
    const project = await this.slugLoader.load(slug)
    if (!project) {
      throw new NotFoundException('project not found')
    }

    return project.id
  }

  getProjectsByRepo(host: GitHost, namespace: string, name: string) {
    return Project.createQueryBuilder('project')
      .where('project.host = :host')
      .andWhere('project.namespace = :namespace')
      .andWhere('project.name = :name')
      .setParameters({ host, namespace, name })
      .getMany()
  }

  async getProjects(
    user: User,
    { first, skip, after }: PaginationInput,
    query?: string,
    starOnly = false,
    permission = Permission.Read,
  ) {
    const queryBuilder = Project.createQueryBuilder('project')

    // only allow to query projects that the user starred
    if (starOnly) {
      queryBuilder
        .innerJoin(UserStarredProject, 'star', 'star.project_id = project.id')
        .andWhere('user_id = :userId', { userId: user.id })
    }

    // only allow to query projects that the user can see
    const allowProjectIds = await this.permissionProvider.userAllowList(user, permission)
    if (allowProjectIds.length) {
      queryBuilder.andWhere(
        new Brackets((builder) => {
          if (permission === Permission.Read) {
            // read permission include public
            builder.andWhereInIds(allowProjectIds).orWhere('is_public is true')
          } else {
            builder.andWhereInIds(allowProjectIds)
          }
        }),
      )
    } else {
      if (permission === Permission.Read) {
        // read permission include public
        queryBuilder.andWhere('is_public is true')
      }
    }

    // fuzzy matching
    if (query) {
      queryBuilder
        .andWhere(
          new Brackets((subBuilder) => {
            subBuilder
              .where(`project.namespace like :query`)
              .orWhere(`project.name like :query`)
              .orWhere(`project.slug like :query`)

            if (query.includes('/')) {
              const [namespace, name] = query.split('/')
              subBuilder.orWhere(
                new Brackets((qb) => {
                  if (namespace) {
                    qb.where('project.namespace = :namespace', { namespace })
                    if (name) {
                      qb.andWhere('project.name = :name', { name })
                    }
                  }
                }),
              )
            }
          }),
        )
        .setParameters({ query: `%${query}%` })
    }

    // ignore records before `after`
    if (after) {
      queryBuilder.andWhere('project.id > :after', { after })
    }

    return queryBuilder.orderBy('project.id', 'ASC').skip(skip).take(first).getManyAndCount()
  }

  async getUserStarredProjectSlugs(userId: number) {
    const stars = await UserStarredProject.findBy({ userId })
    const projects = await this.loader.loadMany(stars.map((star) => star.projectId))

    return projects.map((project) => (project && 'slug' in project ? project.slug : null)).filter(Boolean)
  }

  async getProjectUsers(project: Project, permission: Permission) {
    const users = await this.permissionProvider.projectAllowList(project, permission)

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

  async getAuthorizedUsers(project: Project) {
    const owners = await this.getProjectUsers(project, Permission.Admin)
    const viewers = await this.getProjectUsers(project, Permission.Read)

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

    const project = await this.slugLoader.load(slug)
    if (!project) {
      return false
    }

    if (user.isAdmin) {
      return true
    }

    return this.permissionProvider.check(user, project.id, permission)
  }

  async filterUnaccessibleProjects(projects: Project[], user: User, permission: Permission = Permission.Read) {
    if (projects.length < 3) {
      const accessible = await Promise.all(
        projects.map((project) => this.permissionProvider.check(user, project.id, permission)),
      )
      return projects.filter((_, index) => accessible[index])
    } else {
      const allowProjectIds = await this.permissionProvider.userAllowList(user, permission)
      return projects.filter((project) => allowProjectIds.includes(project.id))
    }
  }

  async addProjectOwner(projectId: number, email: string) {
    const [user] = await this.userService.findOrCreateByEmails([email])
    return this.permissionProvider.grant(user, projectId, Permission.Admin)
  }

  async getAccessibleProject(idOrSlug: number | string, user?: User) {
    const project = await Project.findOneByIdSlug(idOrSlug)

    if (project) {
      if (project.isPublic) {
        return project
      } else if (user) {
        const accessible = await this.permissionProvider.check(user, project.id, Permission.Read)
        if (accessible) {
          return project
        }
      }
    }

    return null
  }

  async update(projectId: number, input: UpdateProjectInput) {
    const { artifactBaselineBranch, isPublic } = input

    const projectPayload = omitBy({ artifactBaselineBranch, isPublic }, isUndefined)

    if (!isEmpty(projectPayload)) {
      await Project.update(projectId, projectPayload)
    }

    return this.loader.load(projectId)
  }

  async updateProjectOwners(project: Project, owners: string[]) {
    const users = await this.userService.findOrCreateByEmails(owners)
    const old = await this.getProjectUsers(project, Permission.Admin)
    const removed = differenceBy(old, users, (user) => user.email)
    const added = differenceBy(users, old, (user) => user.email)

    await Promise.all([
      ...removed.map((user) => this.permissionProvider.revoke(user, project.id, Permission.Admin)),
      ...added.map((user) => this.permissionProvider.grant(user, project.id, Permission.Admin)),
    ])
  }

  async updateProjectUserPermission(projectId: number, email: string, permission: Permission, isAdd: boolean) {
    const user = await this.userService.findUserByEmail(email)

    if (!user) {
      throw new UserError('No such user')
    }

    const hasPermission = await this.permissionProvider.check(user, projectId, permission)

    if (isAdd && hasPermission) {
      throw new UserError('User already has this permission')
    } else if (!isAdd && !hasPermission) {
      throw new UserError('User do not has this permission')
    }

    if (isAdd) {
      await this.permissionProvider.grant(user, projectId, permission)
    } else {
      await this.permissionProvider.revoke(user, projectId, permission)
    }
  }

  async verifyNewSlug(newSlug: string): Promise<{ error?: string; ok: boolean }> {
    newSlug = newSlug.trim()
    if (newSlug.length > 100) {
      return { error: 'Id is too long', ok: false }
    }
    if (newSlug.length < 3) {
      return { error: 'Id is too short', ok: false }
    }

    if (/^\d+$/.test(newSlug)) {
      return { error: 'Id should not be all numbers', ok: false }
    }

    if (!/^[0-9a-z-_]+$/.test(newSlug)) {
      return {
        error: `Invalid id ${newSlug}, id should contains only lowercase letters "a-z", numbers "0-9", hyphen "-", underscore "_"`,
        ok: false,
      }
    }

    const project = await Project.findOne({ where: { slug: newSlug } })
    if (project) {
      return { error: `Id ${newSlug} is unavailable`, ok: false }
    }

    return { ok: true }
  }

  async create(user: User, input: CreateProjectInput) {
    const { id, host, name, namespace, artifactBaselineBranch } = input

    const slugVerification = await this.verifyNewSlug(id)

    if (!slugVerification.ok) {
      throw new UserError('Invalid id, ' + slugVerification.error)
    }

    if (input.host === GitHost.Unknown) {
      const settings = await this.settings.current()
      if (!settings.enableProjectCreate) {
        throw new UserError('Project creation is disabled')
      }
    }

    if (!this.config.test && input.host === GitHost.Github) {
      const githubVerification = await this.github.verifyGithubRepositoryPermission(user, input.namespace, input.name)

      if (!githubVerification.ok) {
        throw new UserError('GitHub permission verification error, ' + githubVerification.error)
      }

      input.namespace = githubVerification.caseSensitiveOwner
      input.name = githubVerification.caseSensitiveRepo
    }

    const defaultUsagePack = await UsagePack.findOneByOrFail({
      isDefault: true,
    })

    const project = Project.create({
      name: name,
      namespace: namespace,
      host: host,
      slug: id,
      artifactBaselineBranch,
      usagePack: defaultUsagePack,
    })

    await this.db
      .transaction(async (manager) => {
        await manager.save(project)
        const setting = Setting.create({
          project,
        })
        const userStar = UserStarredProject.create({
          project,
          user,
        })
        await manager.save([setting, userStar], { reload: false })
      })
      .catch(mapInternalError('Create project Failed'))

    this.metricService.newProject(1)
    this.metricService.totalProject(await Project.count())
    await this.permissionProvider.onCreateProject(project, [user], user)

    const profileIid = await this.internalIdService.generate(project.id, InternalIdUsage.Profile)
    const envIid = await this.internalIdService.generate(project.id, InternalIdUsage.Env)
    await Promise.all([
      Profile.create({
        project,
        iid: profileIid,
      }).save(),
      Environment.create({
        project,
        name: 'default',
        iid: envIid,
      }).save(),
    ])
    return project
  }

  async toggleStarProject(userId: number, slug: string, add: boolean) {
    const project = await this.slugLoader.load(slug)

    if (!project) {
      throw new UserError('Unknown Project')
    }

    const projectId = project.id

    const starred = await UserStarredProject.findOneBy({
      userId,
      projectId,
    })

    if (starred) {
      if (!add) {
        await UserStarredProject.remove(starred)
      }
    } else if (add) {
      await UserStarredProject.create({
        userId,
        projectId,
      }).save()
    }
  }

  async getUserPermission(user: User, project: Project) {
    return this.permissionProvider.get(user, project.id)
  }

  @Cron(CronExpression.EVERY_HOUR, { exclusive: true, name: 'project-count' })
  async recordActiveProject() {
    const byDay = await this.getActiveProjectCountByPeriod(1, 'DAY')
    if (byDay) {
      this.metricService.activeProject(byDay, { period: 'DAY' })
    }

    const byWeek = await this.getActiveProjectCountByPeriod(1, 'WEEK')
    if (byWeek) {
      this.metricService.activeProject(byWeek, { period: 'WEEK' })
    }

    const byMonth = await this.getActiveProjectCountByPeriod(1, 'MONTH')
    if (byMonth) {
      this.metricService.activeProject(byMonth, { period: 'MONTH' })
    }
  }

  async deleteProject(projectId: number) {
    const settings = await this.settings.current()
    if (!settings.enableProjectDelete) {
      throw new ForbiddenException('Project deletion is disabled')
    }
    this.logger.log('start delete project', { projectId })
    await Project.delete({ id: projectId })

    setImmediate(() => {
      void this.deleteFolders(projectId)
    })

    return true
  }

  private async deleteFolders(projectId: number) {
    await this.logStorage.deleteFolder(`logs/${projectId}`)
    await this.storage.deleteFolder(`artifacts/${projectId}`)
    await this.storage.deleteFolder(`builds/${projectId}`) // artifact builds
  }

  private async getActiveProjectCountByPeriod(value: number, period: 'DAY' | 'WEEK' | 'MONTH') {
    return Job.createQueryBuilder()
      .select('count(distinct project_id) as count')
      .where(`created_at > DATE_SUB(NOW(), INTERVAL ${value} ${period})`)
      .getRawOne<{ count: string }>()
      .then((result) => (result ? parseInt(result.count, 10) : undefined))
  }

  private insertUserPermission(users: User[], permission: Permission) {
    return users.map((user) => ({ ...user, permission }))
  }
}
