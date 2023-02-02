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
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  RelationId,
  Index,
  BaseEntity,
  OneToMany,
} from 'typeorm'

import { BundleJobStatus } from '@perfsee/server-common'

import type { Project } from './project.entity'
import type { ScriptFile } from './script-file.entity'
import type { AppVersion } from './app-version.entity'

registerEnumType(BundleJobStatus, {
  name: 'BundleJobStatus',
})

@ObjectType({ description: 'artifact contains the information of all bundled static files.' })
@Entity()
export class Artifact extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @ManyToOne('Project', 'artifacts', { onDelete: 'CASCADE' })
  project!: Project

  @RelationId('project')
  @Index()
  @Column()
  projectId!: number

  @Field(() => Int, { name: 'id' })
  @Column({ type: 'int' })
  iid!: number

  @Field(() => String, { description: 'artifact name' })
  @Column({ type: 'varchar' })
  name!: string

  @Field(() => String, { description: 'git commit hash' })
  @Column({ type: 'varchar', length: '40' })
  hash!: string

  @Field(() => String, { description: 'git branch' })
  @Column({ type: 'varchar' })
  @Index()
  branch!: string

  @Field(() => String, { description: 'user uploaded the build' })
  @Column({ type: 'varchar', length: '100' })
  issuer!: string

  @Field(() => String, {
    description: 'the build file key in storage',
    deprecationReason: 'will be removed in the future',
  })
  @Column({ type: 'varchar' })
  buildKey!: string

  @Field(() => BundleJobStatus, { description: 'status of bundle analyzing progress' })
  @Column({ type: 'int', default: BundleJobStatus.Pending })
  status!: BundleJobStatus

  @Field(() => String, { description: 'reason for failed analyzing', nullable: true })
  @Column({ type: 'text', nullable: true })
  failedReason!: string

  @Field(() => String, {
    description: 'the report file key in storage',
    nullable: true,
    deprecationReason: 'use `reportLink` instead',
  })
  @Column({ type: 'varchar', nullable: true })
  reportKey!: string | null

  @Field(() => String, {
    description: 'the content file key in storage',
    nullable: true,
    deprecationReason: 'use `contentLink` instead',
  })
  @Column({ type: 'varchar', nullable: true })
  contentKey!: string | null

  @Field(() => Int, { description: 'total size introduced by build, report and content files, in bytes' })
  @Column({ default: 0 })
  uploadSize!: number

  @Field(() => Int, { description: 'bundle audit score', nullable: true })
  @Column({ type: 'int', nullable: true })
  score!: number | null

  @Field(() => Int, { description: 'time spent to analyze the build' })
  @Column({ type: 'int', default: 0 })
  duration!: number

  @Field(() => String, { description: 'version of the tool for uploading the build' })
  @Column({ nullable: true, default: 'unknown' })
  appVersion!: string

  @Field(() => String, { description: 'toolkit used to build the bundle', nullable: true })
  @Column({ type: 'varchar', default: 'unknown' })
  toolkit!: string

  @Column({ type: 'int', nullable: true })
  baselineId!: number | null

  @Column({ type: 'boolean', default: false })
  isBaseline!: boolean

  @Field(() => GraphQLISODateTime, { description: 'artifact created timestamp' })
  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date

  @Field(() => GraphQLISODateTime, { description: 'artifact updated timestamp' })
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date

  @OneToMany('ScriptFile', 'fromArtifact')
  addedScriptFiles!: ScriptFile[]

  inProgress() {
    return this.status === BundleJobStatus.Pending || this.status === BundleJobStatus.Running
  }

  running() {
    return this.status === BundleJobStatus.Running
  }

  failed() {
    return this.status === BundleJobStatus.Failed
  }

  succeeded() {
    return this.status === BundleJobStatus.Passed
  }

  /**
   * This property can be used to query the artifact list, leftJoin AppVersion table, and store appVersion on this property.
   */
  version?: AppVersion | null
}

@Entity()
export class ArtifactName extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @ManyToOne('Project', 'artifacts', { onDelete: 'CASCADE' })
  project!: Project

  @RelationId('project')
  @Index()
  @Column()
  projectId!: number

  @Column({ type: 'varchar' })
  name!: string

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date

  @Field(() => GraphQLISODateTime, { description: 'last timestamp a build with same artifact name uploaded' })
  @Column({ type: 'timestamp' })
  lastUploadedAt!: Date

  static async record(projectId: number, name: string) {
    let record = await this.findOneBy({ projectId, name })

    if (!record) {
      record = this.create({
        projectId,
        name,
        lastUploadedAt: new Date(),
      })
    } else {
      record.lastUploadedAt = new Date()
    }

    await record.save()
  }
}
