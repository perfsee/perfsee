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

import { ObjectType, Field, Int, GraphQLISODateTime, registerEnumType } from '@nestjs/graphql'
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  RelationId,
  Index,
  BaseEntity,
} from 'typeorm'

import { SnapshotStatus } from '@perfsee/server-common'

import type { Project } from './project.entity'
import type { SnapshotReport } from './snapshot-report.entity'

export enum SnapshotTrigger {
  Api,
  Scheduler,
}

registerEnumType(SnapshotTrigger, {
  name: 'SnapshotTrigger',
})

@ObjectType({ description: 'a group of page performance reports' })
@Entity()
export class Snapshot extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @ManyToOne('Project', 'snapshots', { onDelete: 'CASCADE' })
  project!: Project

  @RelationId('project')
  @Index()
  @Column()
  projectId!: number

  @Field(() => Int, { name: 'id' })
  @Column({ type: 'int' })
  iid!: number

  @Field(() => GraphQLISODateTime, { description: 'snapshot created timestamp' })
  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date

  @Field(() => GraphQLISODateTime, { nullable: true, description: 'snapshot job start time' })
  @Column({ type: 'timestamp', nullable: true })
  startedAt!: Date | null

  @Field(() => SnapshotStatus, { description: 'snapshot job status' })
  @Column({ type: 'int', default: SnapshotStatus.Scheduled })
  status!: SnapshotStatus

  @Field(() => String, { nullable: true, description: 'snapshot job failure reason' })
  @Column({ type: 'text', nullable: true })
  failedReason!: string | null

  @Field(() => String, { description: 'snapshot creator', nullable: true })
  @Column({ type: 'varchar', comment: 'snapshot creator', nullable: true })
  issuer!: string | null

  @Field(() => String, { description: 'git commit hash', nullable: true })
  @Index()
  @Column({ type: 'varchar', length: '40', comment: 'git commit hash', nullable: true })
  hash!: string | null

  @Field(() => String, { nullable: true, description: 'snapshot title' })
  @Column({ type: 'varchar', nullable: true, comment: 'snapshot title' })
  title!: string | null

  @Field(() => SnapshotTrigger, { description: 'by which the snapshot triggered' })
  @Column({ type: 'int', default: SnapshotTrigger.Api })
  trigger!: SnapshotTrigger

  @OneToMany('SnapshotReport', 'snapshot')
  reports!: SnapshotReport[]
}
