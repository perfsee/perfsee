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

import { ObjectType, Field, Int, GraphQLISODateTime } from '@nestjs/graphql'
import GraphQLJSON from 'graphql-type-json'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  BaseEntity,
  RelationId,
  ManyToOne,
} from 'typeorm'

import { FlameChartDiagnosticInfo } from '@perfsee/shared'

import type { Project } from './project.entity'
import type { SnapshotReport } from './snapshot-report.entity'

@Entity()
@ObjectType({ description: 'source code performance issue found' })
export class SourceIssue extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Field(() => Int, { name: 'id' })
  @Column({ type: 'int' })
  iid!: number

  @Index()
  @Column()
  @RelationId('project')
  projectId!: number

  @ManyToOne('Project', 'sourceIssues', { onDelete: 'CASCADE' })
  project!: Project

  @Field({ description: 'git commit hash' })
  @Column()
  @Index()
  hash!: string

  @Field(() => Int, { description: 'source snapshot report id' })
  @Column()
  @RelationId('snapshotReport')
  snapshotReportId!: number

  @ManyToOne('SnapshotReport', 'sourceIssues', { onDelete: 'CASCADE' })
  snapshotReport!: SnapshotReport

  @Field({ description: 'issue code' })
  @Column({ comment: 'issue code' })
  code!: string

  @Field({ description: 'issue frame key, formatted in functionName:FilePath:line:col' })
  @Column({ comment: 'formatted in functionName:FilePath:line:col' })
  frameKey!: string

  @Field(() => GraphQLJSON, { description: 'extra information to description given issue' })
  @Column({ type: 'json', comment: 'extra information to description given issue' })
  info!: FlameChartDiagnosticInfo

  @Field(() => GraphQLISODateTime, { description: 'issue created timestamp' })
  @CreateDateColumn()
  createdAt!: Date
}
