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
import { BundleJobStatus } from '@perfsee/server-common'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  BaseEntity,
  Index,
  ManyToOne,
  RelationId,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm'
import { AppVersion } from './app-version.entity'
import { FileSize } from './artifact-entrypoint.entity'
import { Project } from './project.entity'

@ObjectType()
@Entity()
export class Package extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Field(() => Int, { name: 'id' })
  @Index()
  @Column({ type: 'int' })
  iid!: number

  @ManyToOne('Project', 'packages', { onDelete: 'CASCADE' })
  project!: Project

  @Index()
  @RelationId('project')
  @Column()
  projectId!: number

  @Field(() => String, { description: 'package name' })
  @Column({ type: 'varchar' })
  name!: string

  @Field(() => String, { description: 'package description', nullable: true })
  @Column({ type: 'varchar', nullable: true })
  description!: string

  @Field(() => [String], { description: 'package author', nullable: true })
  @Column({ type: 'json', nullable: true })
  keywords!: string[] | null

  @Field(() => GraphQLISODateTime, { description: 'artifact created timestamp' })
  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date

  @Field(() => GraphQLISODateTime, { description: 'artifact updated timestamp' })
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date

  @OneToMany('PackageBundle', 'package')
  bundles!: PackageBundle[]
}

@ObjectType()
@Entity()
export class PackageBundle extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Field(() => Int, { name: 'id' })
  @Index()
  @Column({ type: 'int' })
  iid!: number

  @ManyToOne('Package', 'bundles', { onDelete: 'CASCADE' })
  package!: Package

  @RelationId('package')
  @Index()
  @Column()
  packageId!: number

  @Field(() => String, { description: 'package name' })
  @Column({ type: 'varchar' })
  name!: string

  @Field(() => String, { description: 'package version' })
  @Column({ type: 'varchar' })
  @Index()
  version!: string

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

  @Column({ type: 'varchar' })
  buildKey!: string

  @Field(() => BundleJobStatus, { description: 'status of bundle analyzing progress' })
  @Column({ type: 'int', default: BundleJobStatus.Pending })
  status!: BundleJobStatus

  @Field(() => String, { description: 'reason for failed analyzing', nullable: true })
  @Column({ type: 'text', nullable: true })
  failedReason!: string

  @Column({ type: 'varchar', nullable: true })
  reportKey!: string | null

  @Column({ type: 'varchar', nullable: true })
  benchmarkKey!: string | null

  @Field(() => Int, { description: 'total size introduced by build, report and content files, in bytes' })
  @Column({ default: 0 })
  uploadSize!: number

  @Field(() => FileSize, { description: 'size of the entrypoint', nullable: true })
  @Column({ type: 'json', nullable: true })
  size!: FileSize

  @Field(() => Int, { description: 'time spent to analyze the build' })
  @Column({ type: 'int', default: 0 })
  duration!: number

  @Column({ nullable: true, default: 'unknown' })
  appVersion!: string

  @Column({ type: 'int', nullable: true })
  baselineId!: number | null

  @Column({ type: 'boolean', default: false })
  isBaseline!: boolean

  @Field(() => Boolean, { description: 'has size effects', nullable: true })
  @Column({ type: 'boolean', default: false })
  hasSideEffects?: boolean

  @Field(() => Boolean, { description: 'has js module', nullable: true })
  @Column({ type: 'boolean', default: false })
  hasJSModule?: boolean

  @Field(() => Boolean, { description: 'has js next', nullable: true })
  @Column({ type: 'boolean', default: false })
  hasJSNext?: boolean

  @Field(() => Boolean, { description: 'is module type', nullable: true })
  @Column({ type: 'boolean', default: false })
  isModuleType?: boolean

  @Field(() => GraphQLISODateTime, { description: 'artifact created timestamp' })
  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date

  @Field(() => GraphQLISODateTime, { description: 'artifact updated timestamp' })
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date

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
   * This property can be used to query the package list, leftJoin AppVersion table, and store appVersion on this property.
   */
  appversion?: AppVersion | null
}
