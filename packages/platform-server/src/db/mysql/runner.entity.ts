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

import { Field, ObjectType, GraphQLISODateTime, registerEnumType, ID } from '@nestjs/graphql'
import GraphQLJSON from 'graphql-type-json'
import { BaseEntity, Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

import { JobType } from '@perfsee/server-common'

import type { Job } from './job.entity'

registerEnumType(JobType, {
  name: 'JobType',
  description: 'available job types',
})

@ObjectType({ description: 'runner register tokens and information' })
@Entity()
export class Runner extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Field(() => ID, { name: 'id' })
  @Index({ unique: true })
  @Column({ type: 'varchar' })
  uuid!: string

  @Column({ select: false, type: 'varchar' })
  registrationToken!: string

  @Index()
  @Column({ select: false, type: 'varchar' })
  token!: string

  @Field()
  @Column({ nullable: true, type: 'varchar' })
  name!: string

  @Column({ type: 'varchar' })
  @Field(() => JobType, { description: 'specific job type the runner will consume' })
  jobType!: JobType

  @Column({ type: 'timestamp' })
  @Field(() => GraphQLISODateTime, { description: 'last runner contacted timestamp' })
  contactedAt!: Date

  @Column({ type: 'bool' })
  @Field(() => Boolean, { description: 'whether runner is in active status' })
  active!: boolean

  @Column({ type: 'varchar' })
  @Field(() => String, { description: 'runner version' })
  version!: string

  @Column({ type: 'varchar' })
  @Field(() => String, { description: 'the version of node runner running on' })
  nodeVersion!: string

  @Column({ type: 'varchar' })
  @Field(() => String, { description: 'runner platform' })
  platform!: string

  @Column({ type: 'varchar' })
  @Field(() => String, { description: 'runner arch' })
  arch!: string

  @Column({ type: 'varchar' })
  @Field(() => String, { description: 'zone info of runner' })
  zone!: string

  @Column({ type: 'json', nullable: true })
  @Field(() => GraphQLJSON, { nullable: true, description: 'extra runner infomations from register' })
  extra!: Record<string, string | number | boolean> | null

  @CreateDateColumn({ type: 'timestamp' })
  @Field(() => GraphQLISODateTime, { description: 'created timestamp' })
  createdAt!: Date

  @OneToMany('Job', 'runner')
  jobs!: Job[]
}
