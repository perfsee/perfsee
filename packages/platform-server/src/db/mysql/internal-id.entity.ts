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

import { Entity, PrimaryGeneratedColumn, Column, Index, Unique, BaseEntity, ManyToOne, RelationId } from 'typeorm'

import type { Project } from './project.entity'

export enum InternalIdUsage {
  Artifact = 0,
  Snapshot = 1,
  SourceIssue = 2,
  Setting = 3,
  Page = 4,
  Env = 5,
  Profile = 6,
  AppVersion = 7,
  Job = 8,
  SnapshotReport = 9,
  Package = 10,
}

@Entity()
@Unique(['projectId', 'usage'])
export class InternalId extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Index()
  @Column({ type: 'int' })
  @RelationId('project')
  projectId!: number

  @ManyToOne('Project', { onDelete: 'CASCADE' })
  project!: Project

  @Column({ type: 'tinyint' })
  usage!: InternalIdUsage

  @Column({ type: 'int' })
  lastValue!: number
}
