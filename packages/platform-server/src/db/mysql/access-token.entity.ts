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

import { ObjectType, Field, GraphQLISODateTime } from '@nestjs/graphql'
import {
  Index,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  BaseEntity,
  ManyToOne,
  RelationId,
  BeforeInsert,
} from 'typeorm'

import type { User } from './user.entity'

@ObjectType()
@Entity()
export class AccessToken extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Column({ type: 'int' })
  @Index()
  @RelationId('user')
  userId!: number

  @ManyToOne('User', 'accessTokens', { onDelete: 'CASCADE' })
  user!: User

  @Field()
  @Column()
  name!: string

  @Column({ select: false })
  @Index()
  token!: string

  @Field(() => GraphQLISODateTime)
  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date

  @Field(() => GraphQLISODateTime)
  @Column({ type: 'timestamp' })
  lastUsedAt!: Date

  @BeforeInsert()
  init() {
    this.lastUsedAt = new Date()
  }
}
