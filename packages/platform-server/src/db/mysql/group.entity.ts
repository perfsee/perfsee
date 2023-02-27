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

import { ObjectType, Field, ID } from '@nestjs/graphql'
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BaseEntity, Index, OneToMany } from 'typeorm'
import type { UserGroupPermission } from './user-group-permission.entity'

@ObjectType()
@Entity()
export class Group extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Field(() => ID, {
    name: 'id',
    description: 'group unique id, contains only lowercase letters "a-z", numbers "0-9", hyphen "-", underscore "_"',
  })
  @Column({ type: 'varchar', length: 100 })
  @Index({ unique: true })
  slug!: string

  @Field({ description: 'group created timestamp' })
  @CreateDateColumn()
  createdAt!: Date

  @OneToMany('UserGroupPermission', 'group')
  permissions!: UserGroupPermission[]
}
