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

import { ObjectType, Field, GraphQLISODateTime, PickType, Int } from '@nestjs/graphql'
import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

import type { AccessToken } from './access-token.entity'
import type { UserConnectedAccount } from './user-connected-account.entity'
import type { UserPermission } from './user-permission.entity'

@Entity()
@ObjectType()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Column()
  @Field()
  username!: string

  @Column()
  @Field()
  email!: string

  @Column({ type: 'varchar', length: 255, select: false, nullable: true })
  password!: string | null

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Field(() => String, { nullable: true })
  firstName!: string | null

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Field(() => String, { nullable: true })
  lastName!: string | null

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  avatarUrl!: string | null

  @Field(() => GraphQLISODateTime, { description: 'issue created timestamp' })
  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date

  @Field(() => Boolean, { description: 'is application' })
  @Column({ type: 'boolean', default: false })
  isApp!: boolean

  @Field(() => Boolean)
  @Column({ type: 'boolean', default: false })
  isAdmin!: boolean

  @Column({ type: 'boolean', default: true })
  isFulfilled!: boolean

  @OneToMany('AccessToken', 'user')
  accessTokens!: AccessToken[]

  @OneToMany('UserConnectedAccount', 'user')
  connectedAccounts!: UserConnectedAccount[]

  @OneToMany('UserPermission', 'user')
  permissions!: UserPermission[]
}

@ObjectType()
export class Application extends PickType(User, ['username', 'createdAt']) {
  @Field(() => Int)
  id!: number
}
