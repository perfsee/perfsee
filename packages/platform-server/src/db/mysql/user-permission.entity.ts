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

import { registerEnumType } from '@nestjs/graphql'
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm'

import { Permission } from '@perfsee/shared'

import type { Project } from './project.entity'
import type { User } from './user.entity'

registerEnumType(Permission, { name: 'Permission' })

@Entity()
export class UserPermission extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Column({ type: 'int' })
  @Index()
  @RelationId('user')
  userId!: number

  @ManyToOne('User', 'permissions', { onDelete: 'CASCADE' })
  user!: User

  @Column({ type: 'int' })
  @Index()
  @RelationId('project')
  projectId!: number

  @ManyToOne('Project', 'permissions', { onDelete: 'CASCADE' })
  project!: Project

  @Column({ type: 'varchar', length: 255 })
  permission!: Permission

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date
}
