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
import type { UserPermissionWithOrg } from './user-permission-with-org.entity'

import { dbJSONTransformerFactory } from './utils'

@ObjectType()
@Entity()
export class Organization extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Field(() => ID, {
    name: 'id',
    description:
      'organization unique id, contains only lowercase letters "a-z", numbers "0-9", hyphen "-", underscore "_"',
  })
  @Column({ type: 'varchar', length: 100 })
  @Index({ unique: true })
  slug!: string

  @Field(() => Boolean, { description: 'is the organization public to everyone' })
  @Column({ type: 'boolean', default: false })
  isPublic!: boolean

  @Field({ description: 'organization created timestamp' })
  @CreateDateColumn()
  createdAt!: Date

  @Field(() => [String], { description: 'related project slugs' })
  @Column('text', { transformer: dbJSONTransformerFactory([]) })
  projectSlugs!: string[]

  @OneToMany('UserPermissionWithOrg', 'organization')
  permissions!: UserPermissionWithOrg[]
}
