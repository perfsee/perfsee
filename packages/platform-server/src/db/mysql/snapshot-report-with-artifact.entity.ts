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

import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, ManyToOne, RelationId, Index } from 'typeorm'

import type { Artifact } from './artifact.entity'
import type { SnapshotReport } from './snapshot-report.entity'

@Entity()
export class SnapshotReportWithArtifact extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Column()
  @RelationId('snapshotReport')
  @Index()
  snapshotReportId!: number

  @ManyToOne('SnapshotReport', 'snapshotReportWithArtifacts', { onDelete: 'CASCADE' })
  snapshotReport!: SnapshotReport

  @Column()
  @RelationId('artifact')
  @Index()
  artifactId!: number

  @ManyToOne('Artifact', 'artifactWithSnapshotReports', { onDelete: 'CASCADE' })
  artifact!: Artifact
}
