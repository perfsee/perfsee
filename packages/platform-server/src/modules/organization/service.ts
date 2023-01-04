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
import { differenceBy, isEmpty, isUndefined, omitBy } from 'lodash'
import { Brackets, In, Between } from 'typeorm'

import {
  Organization,
  User,
  Project,
  ProjectStorageUsage,
  ProjectJobUsage,
  SnapshotReport,
  Artifact,
} from '@perfsee/platform-server/db'
import { UserError } from '@perfsee/platform-server/error'
import { PaginationInput } from '@perfsee/platform-server/graphql'
import { Logger } from '@perfsee/platform-server/logger'
import { Metric } from '@perfsee/platform-server/metrics'
import { createDataLoader } from '@perfsee/platform-server/utils'

import { PermissionProvider, Permission } from '../permission'
import { UserService } from '../user'

import { CreateOrganizationInput, OrganizationUsage, UpdateOrganizationInput } from './types'

@Injectable()
export class OrganizationService {
  loader = createDataLoader((ids: number[]) =>
    Organization.findBy({
      id: In(ids),
    }),
  )

  constructor(
    private readonly permissionProvider: PermissionProvider,
    private readonly userService: UserService,
    private readonly metricService: Metric,
    private readonly logger: Logger,
  ) {}

  async resolveRawOrganizationIdBySlug(slug: string) {
    const organization = await this.getOrganization(slug)
    if (!organization) {
      throw new NotFoundException('organization not found')
    }

    return organization.id
  }

  getOrganizationById(id: number) {
    return Organization.findOneByOrFail({ id })
  }

  async getOrganizations(user: User, { first, skip, after }: PaginationInput, query?: string) {
    const queryBuilder = Organization.createQueryBuilder('organization')

    // only allow to query organizations that the user can see
    const allowOrganizationIds = await this.permissionProvider.userAllowList(user, Permission.Read, true)
    if (allowOrganizationIds.length) {
      queryBuilder.andWhere(
        new Brackets((builder) => {
          builder.andWhereInIds(allowOrganizationIds).orWhere('is_public is true')
        }),
      )
    } else {
      queryBuilder.andWhere('is_public is true')
    }

    // fuzzy matching
    if (query) {
      queryBuilder
        .andWhere(
          new Brackets((subBuilder) => {
            subBuilder.where(`organization.slug like :query`)
          }),
        )
        .setParameters({ query: `%${query}%` })
    }

    // ignore records before `after`
    if (after) {
      queryBuilder.andWhere('organization.id > :after', { after })
    }

    return queryBuilder.orderBy('organization.id', 'ASC').skip(skip).take(first).getManyAndCount()
  }

  async getOrganizationUsers(organization: Organization, permission: Permission) {
    const users = await this.permissionProvider.organizationAllowList(organization, permission)

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

  async getAuthorizedUsers(organization: Organization) {
    const owners = await this.getOrganizationUsers(organization, Permission.Admin)
    const viewers = await this.getOrganizationUsers(organization, Permission.Read)

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

    const organization = await this.getOrganization(slug)
    if (!organization) {
      return false
    }

    if (user.isAdmin) {
      return true
    }

    return this.permissionProvider.check(user, organization.id, permission, true)
  }

  async addOrganizationOwner(organizationId: number, email: string) {
    const [user] = await this.userService.findOrCreateByEmails([email])
    return this.permissionProvider.grant(user, organizationId, Permission.Admin, true)
  }

  getOrganization(slug: string) {
    return Organization.createQueryBuilder('organization')
      .where('organization.slug = :slug')
      .setParameters({ slug })
      .getOne()
  }

  async update(organizationId: number, input: UpdateOrganizationInput) {
    const { projectSlugs, isPublic } = input

    const organizationPayload = omitBy({ projectSlugs, isPublic }, isUndefined)

    if (!isEmpty(organizationPayload)) {
      await Organization.update(organizationId, organizationPayload)
    }

    return this.loader.load(organizationId)
  }

  async updateOrganizationOwners(organization: Organization, owners: string[]) {
    const users = await this.userService.findOrCreateByEmails(owners)
    const old = await this.getOrganizationUsers(organization, Permission.Admin)
    const removed = differenceBy(old, users, (user) => user.email)
    const added = differenceBy(users, old, (user) => user.email)

    await Promise.all([
      ...removed.map((user) => this.permissionProvider.revoke(user, organization.id, Permission.Admin, true)),
      ...added.map((user) => this.permissionProvider.grant(user, organization.id, Permission.Admin, true)),
    ])
  }

  async updateOrganizationUserPermission(
    organizationId: number,
    email: string,
    permission: Permission,
    isAdd: boolean,
  ) {
    const user = await this.userService.findUserByEmail(email)

    if (!user) {
      throw new UserError('No such user')
    }

    const hasPermission = await this.permissionProvider.check(user, organizationId, permission, true)

    if (isAdd && hasPermission) {
      throw new UserError('User already has this permission')
    } else if (!isAdd && !hasPermission) {
      throw new UserError('User do not has this permission')
    }

    if (isAdd) {
      await this.permissionProvider.grant(user, organizationId, permission, true)
    } else {
      await this.permissionProvider.revoke(user, organizationId, permission, true)
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
    const organization = await Organization.findOne({ where: { slug: newSlug } })
    if (organization) {
      return { error: 'Id is unavailable', ok: false }
    }
    return { ok: true }
  }

  async create(user: User, input: CreateOrganizationInput) {
    const { id, projectSlugs } = input

    const slugVerification = await this.verifyNewSlug(id)

    if (!slugVerification.ok) {
      throw new UserError('Invalid id, ' + slugVerification.error)
    }

    const organization = await Organization.save({
      slug: id,
      projectSlugs,
    })

    this.metricService.newOrganization(1)
    this.metricService.totalOrganization(await Organization.count())
    await this.permissionProvider.onCreateOrganization(organization, [user], user)

    return organization
  }

  async getUserPermission(user: User, organization: Organization) {
    return this.permissionProvider.get(user, organization.id, true)
  }

  async deleteOrganization(organizationId: number) {
    this.logger.log('start delete organization', { organizationId })
    await Organization.delete({ id: organizationId })

    return true
  }

  async getProjectUsages(from: Date, to: Date, organization: Organization) {
    if (to < from) {
      throw Error('Invalid date range.')
    }

    const projects = await Project.findBy({ slug: In(organization.projectSlugs) })
    const projectIds = projects.map((p) => p.id)

    const map = new Map<number, OrganizationUsage>()

    for (const project of projects) {
      const [reports, snapshotReportCount] = await SnapshotReport.findAndCountBy({
        projectId: project.id,
        createdAt: Between(from, to),
      })
      const [artifacts, artifactCount] = await Artifact.findAndCountBy({
        projectId: project.id,
        createdAt: Between(from, to),
      })

      let validScoreCount = 0
      const bundleSumScore = artifacts.reduce((p, c) => {
        if (typeof c.score === 'number') {
          validScoreCount++
          return p + c.score
        }
        return p
      }, 0)

      let validLabScoreCount = 0
      const labSumScore = reports.reduce((p, c) => {
        if (c.performanceScore) {
          validLabScoreCount++
          return p + c.performanceScore
        }
        return p
      }, 0)

      map.set(project.id, {
        artifactCount,
        snapshotReportCount,
        projectId: project.slug,
        jobCount: 0,
        jobDuration: 0,
        storage: 0,
        bundleScore: validScoreCount ? bundleSumScore / validScoreCount : 0,
        labScore: validLabScoreCount ? labSumScore / validLabScoreCount : 0,
      })
    }

    const start = new Date(from)
    const startYear = start.getFullYear()
    const startMonth = start.getMonth() + 1

    const end = new Date(to)
    const endYear = end.getFullYear()
    const endMonth = end.getMonth() + 1

    for (let year = startYear; year <= endYear; year++) {
      for (let month = year === startYear ? startMonth : 1; month <= (year === endYear ? endMonth : 12); month++) {
        const jobUsage = await ProjectJobUsage.findBy({ projectId: In(projectIds), year, month })

        jobUsage.forEach((usage) => {
          const prevUsage = map.get(usage.projectId) as OrganizationUsage
          map.set(usage.projectId, {
            ...prevUsage,
            jobCount: prevUsage.jobCount + (usage.jobCount ?? 0),
            jobDuration: prevUsage.jobDuration + parseFloat(usage.jobDuration ?? '0'),
          })
        })
      }
    }

    const storageUsage = await ProjectStorageUsage.findBy({ projectId: In(projectIds) })

    storageUsage.forEach((usage) => {
      map.set(usage.projectId, {
        ...(map.get(usage.projectId) as OrganizationUsage),
        storage: parseFloat(usage.used ?? '0'),
      })
    })

    return Array.from(map.values())
  }

  private insertUserPermission(users: User[], permission: Permission) {
    return users.map((user) => ({ ...user, permission }))
  }
}
