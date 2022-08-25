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
import { GraphQLJSON } from 'graphql-type-json'
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Index,
  RelationId,
  BaseEntity,
  OneToMany,
  BeforeInsert,
} from 'typeorm'

import { SnapshotStatus } from '@perfsee/server-common'
import { MetricKeyType } from '@perfsee/shared'

import type { Project } from './project.entity'
import type { Environment, Page, Profile } from './property.entity'
import type { Snapshot } from './snapshot.entity'
import type { SourceIssue } from './source-issue.entity'

registerEnumType(SnapshotStatus, { name: 'SnapshotStatus' })

@ObjectType({ description: 'page performance report' })
@Entity()
export class SnapshotReport extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Field(() => Int, { name: 'id' })
  @Column({ type: 'int' })
  iid!: number

  @ManyToOne('Project', 'snapshotReports')
  project!: Project

  @Index()
  @Column()
  @RelationId('project')
  projectId!: number

  @ManyToOne('Snapshot', 'reports')
  snapshot!: Snapshot

  @Index()
  @Column()
  @RelationId('snapshot')
  snapshotId!: number

  @ManyToOne('Page', 'reports')
  page!: Page

  @RelationId('page')
  @Column({ type: 'int' })
  pageId!: number

  @ManyToOne('Profile', 'reports')
  profile!: Profile

  @RelationId('profile')
  @Column({ type: 'int' })
  profileId!: number

  @ManyToOne('Environment', 'reports')
  env!: Environment

  @RelationId('env')
  @Column({ type: 'int' })
  envId!: number

  @Field(() => GraphQLISODateTime, { description: 'report created timestamp' })
  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date

  @Field(() => SnapshotStatus, { description: 'job status' })
  @Column({ type: 'tinyint', default: SnapshotStatus.Scheduled })
  status!: SnapshotStatus

  @Field(() => String, {
    nullable: true,
    description: 'lighthouse result key in storage, you may fetch the result with this key from storage service',
  })
  @Column({ type: 'varchar', nullable: true })
  lighthouseStorageKey!: string | null

  @Field(() => String, {
    nullable: true,
    description: 'screen cast key in storage, you may fetch screen cast with this key from storage service',
  })
  @Column({ type: 'varchar', nullable: true })
  screencastStorageKey!: string | null

  @Field(() => String, {
    nullable: true,
    description: 'js coverage data key in storage, you can fetch result with this key at storage service',
  })
  @Column({ type: 'varchar', nullable: true })
  jsCoverageStorageKey!: string | null

  @Field(() => String, {
    nullable: true,
    description: 'chrome track events key in storage, you may fetch track events with this key from storage service',
  })
  @Column({ type: 'varchar', nullable: true })
  traceEventsStorageKey!: string | null

  @Field(() => String, {
    nullable: true,
    description:
      'flame chart raw data key in storage, you may fetch flame chart detail with this key from storage service',
  })
  @Column({ type: 'varchar', nullable: true })
  flameChartStorageKey!: string | null

  @Field(() => String, {
    nullable: true,
    description:
      'source coverage data key in storage, you may fetch flame chart detail with this key from storage service',
  })
  @Column({ type: 'varchar', nullable: true })
  sourceCoverageStorageKey!: string | null

  @Field(() => GraphQLJSON, { description: 'key metrics data' })
  @Column({ type: 'json', nullable: true })
  metrics!: Record<MetricKeyType, number | null | undefined>

  @Field({ nullable: true, description: 'failure reason if report job failed' })
  @Column({ nullable: true })
  failedReason!: string

  @Field(() => Int, { nullable: true, description: 'lighthouse performance score' })
  @Column({ type: 'int', nullable: true })
  performanceScore!: number | null

  @Field({ nullable: true, description: 'only exists in dynamic host jobs' })
  @Column({ type: 'varchar', nullable: true })
  host!: string

  @OneToMany('SourceIssue', 'snapshotReport')
  sourceIssues!: SourceIssue[]

  @BeforeInsert()
  init() {
    this.metrics = {} as any
  }
}
