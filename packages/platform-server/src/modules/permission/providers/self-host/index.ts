/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.group/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { Injectable } from '@nestjs/common'

import { Group, Project, User, UserPermission, UserGroupPermission } from '@perfsee/platform-server/db'

import { Permission } from '../../def'
import { PermissionProvider } from '../provider'

const PermissionsMap: { [key in Permission]: number } = {
  [Permission.Admin]: 0b11,
  [Permission.Read]: 0b01,
}

function validate(permission: Permission, wanted: Permission): boolean {
  return (PermissionsMap[permission] & PermissionsMap[wanted]) === PermissionsMap[wanted]
}

@Injectable()
export class SelfHostPermissionProvider extends PermissionProvider {
  async onCreateProject(project: Project, owners: User[], _creator: User) {
    await UserPermission.insert(
      owners.map((owner) => ({
        userId: owner.id,
        projectId: project.id,
        permission: Permission.Admin,
      })),
    )
  }

  async onCreateGroup(group: Group, owners: User[], _creator: User) {
    await UserGroupPermission.insert(
      owners.map((owner) => ({
        userId: owner.id,
        groupId: group.id,
        permission: Permission.Admin,
      })),
    )
  }

  async get(user: User, id: number | string, isGroup?: boolean) {
    if (user.isAdmin) {
      return [Permission.Admin]
    }

    if (isGroup) {
      const group = await Group.findOneByOrFail(typeof id === 'string' ? { slug: id } : { id })
      const permissions = await UserGroupPermission.findBy({ userId: user.id, groupId: group.id })

      return permissions.map((permission) => permission.permission)
    }

    const project = await Project.findOneByIdSlug(id)
    if (!project) {
      throw new Error('Project not found')
    }

    const permissions = await UserPermission.findBy({ userId: user.id, projectId: project.id })
    return permissions.map((permission) => permission.permission)
  }

  async check(user: User, id: number | string, permission: Permission, isGroup?: boolean) {
    if (user.isAdmin) {
      return true
    }

    if (isGroup) {
      const group = await Group.findOneByOrFail(typeof id === 'string' ? { slug: id } : { id })

      const grantedPermissions = await UserGroupPermission.findBy({ userId: user.id, groupId: group.id })

      return grantedPermissions.some((item) => validate(item.permission, permission))
    }

    const project = await Project.findOneByIdSlug(id)
    if (!project) {
      throw new Error('Project not found')
    }

    // pass read permission check if project is public
    if (project.isPublic && permission === Permission.Read) {
      return true
    }

    const grantedPermissions = await UserPermission.findBy({ userId: user.id, projectId: project.id })

    return grantedPermissions.some((item) => validate(item.permission, permission))
  }

  async grant(user: User, id: number, permission: Permission, isGroup?: boolean) {
    if (isGroup) {
      const exist = await UserGroupPermission.findOneBy({ userId: user.id, groupId: id, permission })
      if (exist) {
        return
      }
      await UserGroupPermission.insert({
        userId: user.id,
        groupId: id,
        permission,
      })
      return
    }

    const exist = await UserPermission.findOneBy({ userId: user.id, projectId: id, permission })

    if (exist) {
      return
    }

    await UserPermission.insert({
      userId: user.id,
      projectId: id,
      permission,
    })
  }

  async revoke(user: User, id: number, permission: Permission, isGroup?: boolean) {
    if (isGroup) {
      await UserGroupPermission.delete({
        userId: user.id,
        groupId: id,
        permission,
      })
    } else {
      await UserPermission.delete({
        userId: user.id,
        projectId: id,
        permission,
      })
    }
  }

  async userAllowList(user: User, permission: Permission, isGroup?: boolean) {
    if (isGroup) {
      const list = await UserGroupPermission.findBy({
        userId: user.id,
      })
      return list.filter((item) => validate(item.permission, permission)).map((item) => item.groupId)
    }

    const list = await UserPermission.findBy({
      userId: user.id,
    })

    return list.filter((item) => validate(item.permission, permission)).map((item) => item.projectId)
  }

  async projectAllowList(project: Project, permission: Permission) {
    const list = await UserPermission.findBy({ projectId: project.id })

    return list.filter((item) => validate(item.permission, permission)).map((item) => item.userId)
  }

  async groupAllowList(group: Group, permission: Permission) {
    const list = await UserGroupPermission.findBy({ groupId: group.id })

    return list.filter((item) => validate(item.permission, permission)).map((item) => item.userId)
  }
}
