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

import { Field, GraphQLISODateTime, Int, ObjectType, registerEnumType } from '@nestjs/graphql'
import GraphQLJSON from 'graphql-type-json'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  BaseEntity,
  ManyToOne,
  RelationId,
} from 'typeorm'

import { JobType } from '@perfsee/server-common'

import type { Project } from './project.entity'
import type { Runner } from './runner.entity'

export enum JobStatus {
  Pending,
  Running,
  Done,
  Canceled,
  Failed,
}

export function isSealedJobStatus(status: JobStatus) {
  return status === JobStatus.Done || status === JobStatus.Failed || status === JobStatus.Canceled
}

registerEnumType(JobStatus, { name: 'JobStatus' })

@ObjectType({ description: 'project scope jobs binding with artifacts/lab/source tasks' })
@Entity()
export class Job extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Field(() => Int, { name: 'id' })
  @Column({ type: 'int' })
  iid!: number

  @Column({ type: 'int' })
  @Index()
  @RelationId('project')
  projectId!: number

  @ManyToOne('Project', 'jobs', { onDelete: 'CASCADE' })
  project!: Project

  @Field(() => JobType)
  @Column({ type: 'varchar', length: 50 })
  jobType!: JobType

  @Index()
  @Column({ type: 'int' })
  entityId!: number

  @Index()
  @Field(() => GraphQLISODateTime)
  @CreateDateColumn()
  createdAt!: Date

  @Field(() => GraphQLISODateTime, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  startedAt!: Date | null

  @Field(() => GraphQLISODateTime, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  endedAt!: Date | null

  @Field(() => Number, { nullable: true })
  @Column({ type: 'int', nullable: true })
  duration!: number

  @Field(() => JobStatus)
  @Column({ type: 'tinyint', default: JobStatus.Pending })
  status!: JobStatus

  @Column({ type: 'varchar', length: '50' })
  zone!: string

  @Column({ type: 'int', nullable: true })
  @RelationId('runner')
  runnerId!: number | null

  @ManyToOne('Runner', 'jobs')
  runner!: Runner

  @Field(() => GraphQLJSON, { nullable: true })
  @Column({ type: 'json', nullable: true })
  extra!: Record<string, string> | null

  payload: any

  canceled() {
    return this.status === JobStatus.Canceled
  }

  pending() {
    return this.status === JobStatus.Pending
  }
}
