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

import { ObjectType, Field, GraphQLISODateTime, Int } from '@nestjs/graphql'
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  BaseEntity,
  ManyToOne,
  RelationId,
  OneToMany,
} from 'typeorm'
import { Artifact } from './artifact.entity'

import type { Project } from './project.entity'

@ObjectType({ description: 'Application version information' })
@Entity()
export class AppVersion extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Field(() => Int, { name: 'id' })
  @Column({ type: 'int' })
  iid!: number

  @Column()
  @Index()
  @RelationId('project')
  projectId!: number

  @ManyToOne('Project', 'appVersions', { onDelete: 'CASCADE' })
  project!: Project

  @Field(() => String, { description: 'commit hash' })
  @Column({ type: 'varchar', length: 40 })
  @Index()
  hash!: string

  @Field(() => String, { description: 'commit message', nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  commitMessage!: string | null

  @Field(() => Number, { description: 'pull request number', nullable: true })
  @Column({ type: 'int', nullable: true })
  pr!: number | null

  @Field(() => String, { description: 'git branch', nullable: true })
  @Column({ type: 'varchar', nullable: true })
  branch!: string | null

  @Field(() => String, { description: 'git tag', nullable: true })
  @Column({ type: 'varchar', nullable: true })
  version!: string | null

  @Column({ type: 'int', nullable: true })
  snapshotId!: number | null

  @Column({ type: 'int', nullable: true })
  artifactId!: number | null

  @OneToMany('Artifact', 'version')
  artifacts!: Artifact[]

  @Field(() => Boolean, { description: 'version release exempted' })
  @Column({ type: 'boolean', default: 0 })
  exempted!: boolean

  @Field(() => String, { description: 'reason for exempting release', nullable: true })
  @Column({ type: 'varchar', nullable: true })
  exemptedReason!: string | null

  @Field(() => GraphQLISODateTime, { description: 'created time' })
  @CreateDateColumn()
  createdAt!: Date
}
