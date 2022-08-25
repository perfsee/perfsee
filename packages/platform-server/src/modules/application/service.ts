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

import { Injectable } from '@nestjs/common'
import { groupBy, keyBy, omit, uniq, without } from 'lodash'

import { Project, User, UserPermission } from '@perfsee/platform-server/db'
import { UserError } from '@perfsee/platform-server/error'
import { PaginationInput } from '@perfsee/platform-server/graphql'
import { createDataLoader } from '@perfsee/platform-server/utils'
import { GitHost } from '@perfsee/shared'

import { AuthService } from '../auth/auth.service'
import { Permission, PermissionProvider } from '../permission'
import { ProjectService } from '../project/service'

@Injectable()
export class ApplicationService {
  loader = createDataLoader((ids: number[]) =>
    User.createQueryBuilder().whereInIds(ids).andWhere('is_app = true').getMany(),
  )

  constructor(
    private readonly permissionProvider: PermissionProvider,
    private readonly authService: AuthService,
    private readonly project: ProjectService,
  ) {}

  async getAuthorizedApplications(projectId: number) {
    const permissions = await UserPermission.findBy({ projectId }).then((result) => groupBy(result, 'userId'))

    const appIds = Object.keys(permissions).map((appId) => Number(appId))
    const apps = await User.createQueryBuilder().whereInIds(appIds).andWhere('is_app = true').getMany()

    return apps.map((app) => ({
      app,
      permissions: uniq(permissions[app.id].map((p) => p.permission)),
    }))
  }

  async createApplication(name: string) {
    const existed = await User.findOneBy({ username: name })

    if (existed) {
      throw new UserError('Application already exists')
    }

    const newApplication = User.create({
      username: name,
      email: '',
      source: 'signup',
      isApp: true,
      isFulfilled: true,
    })

    const application = await User.save(newApplication)

    const token = await this.authService.generateToken(newApplication, application.username)

    return {
      token,
      application,
    }
  }

  async authApplication(slug: string, appId: number, permissions: Permission[]) {
    const app = await this.getApplication(appId)
    const projectId = await this.project.resolveRawProjectIdBySlug(slug)

    await Promise.all(permissions.map((permission) => this.permissionProvider.grant(app, projectId, permission)))
  }

  getApplications({ first, after, skip }: PaginationInput) {
    const query = User.createQueryBuilder()

    if (after) {
      query.where('id > :after', { after })
    }

    return query
      .where('is_app = true')
      .orderBy('id', 'ASC')
      .take(first ?? 10)
      .skip(skip)
      .getManyAndCount()
  }

  async getApplicationAuthorizedProjects(appId: number) {
    const permissions = await UserPermission.findBy({ userId: appId }).then((result) => groupBy(result, 'projectId'))

    const projectIds = uniq(Object.keys(permissions).map((projectId) => Number(projectId)))

    const projects = await Project.createQueryBuilder('project')
      .whereInIds(projectIds)
      .select([
        'project.id as rawId',
        'project.slug as id',
        'project.name as name',
        'project.namespace as namespace',
        'project.host as host',
      ])
      .getRawMany<{ rawId: number; id: string; name: string; namespace: string; host: GitHost }>()
      .then((result) => keyBy(result, 'rawId'))

    return Object.entries(permissions).map(([projectId, permissions]) => ({
      project: omit(projects[projectId], 'rawId'),
      permissions: permissions.map((permission) => permission.permission),
    }))
  }

  async updateApplicationPermissions(slug: string, appId: number, permissions: Permission[]) {
    const app = await this.getApplication(appId)
    const projectId = await this.project.resolveRawProjectIdBySlug(slug)
    const rawPermissions = await UserPermission.findBy({ userId: appId, projectId })

    const revokePermissions = rawPermissions.filter((p) => !permissions.includes(p.permission)).map((p) => p.permission)
    const createPermissions = without(permissions, ...rawPermissions.map((p) => p.permission))

    await Promise.all([
      ...revokePermissions.map((p) => this.permissionProvider.revoke(app, projectId, p)),
      ...createPermissions.map((p) => this.permissionProvider.grant(app, projectId, p)),
    ])

    return UserPermission.findBy({ userId: appId, projectId }).then((results) => results.map((p) => p.permission))
  }

  async revokeApplicationPermissions(slug: string, appId: number) {
    const app = await this.getApplication(appId)
    const projectId = await this.project.resolveRawProjectIdBySlug(slug)

    const permissions = await UserPermission.findBy({ userId: appId, projectId }).then((results) =>
      results.map((p) => p.permission),
    )

    await Promise.all(permissions.map((permission) => this.permissionProvider.revoke(app, projectId, permission)))
    return true
  }

  async getApplication(appId: number) {
    const app = await User.findOneBy({ id: appId, isApp: true })

    if (!app) {
      throw new UserError('Application not found')
    }

    return app
  }
}
