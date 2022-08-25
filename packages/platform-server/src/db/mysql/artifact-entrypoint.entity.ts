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
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  RelationId,
  Index,
  BaseEntity,
} from 'typeorm'

import { Size } from '@perfsee/shared'

import { Artifact } from './artifact.entity'
import type { Project } from './project.entity'

@ObjectType()
export class FileSize implements Size {
  @Field()
  raw!: number

  @Field()
  gzip!: number

  @Field()
  brotli!: number
}

@ObjectType({ description: 'brief history data of artifact per entrypoint' })
@Entity()
export class ArtifactEntrypoint extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @ManyToOne('Project', 'artifacts')
  project!: Project

  @RelationId('project')
  @Index()
  @Column()
  projectId!: number

  @ManyToOne('Artifact', 'entrypoints')
  artifact!: Artifact

  @RelationId('artifact')
  @Index()
  @Column()
  artifactId!: number

  @Field({ description: 'git branch' })
  @Column({ type: 'varchar' })
  @Index()
  branch!: string

  @Field({ description: 'git commit hash' })
  @Column({ type: 'varchar', length: 40 })
  hash!: string

  @Field({ description: 'artifact name' })
  @Column({ type: 'varchar' })
  artifactName!: string

  @Field(() => String, { description: 'entrypoint name' })
  @Column({ type: 'varchar' })
  entrypoint!: string

  @Field(() => FileSize, { description: 'total size of the entrypoint' })
  @Column({ type: 'json', nullable: true })
  size!: FileSize

  @Field(() => FileSize, { description: 'total initial size of the entrypoint' })
  @Column({ type: 'json', nullable: true })
  initialSize!: FileSize

  @Field(() => FileSize, { description: 'total size of the baseline entrypoint', nullable: true })
  @Column({ type: 'json', nullable: true })
  baselineSize!: FileSize | null

  @Field(() => FileSize, { description: 'total initial size of the baseline entrypoint', nullable: true })
  @Column({ type: 'json', nullable: true })
  baselineInitialSize!: FileSize | null

  @Field(() => Int, { description: 'bundle audit score', nullable: true })
  @Column({ type: 'int' })
  score!: number

  @Field(() => GraphQLISODateTime, { description: 'artifact created timestamp' })
  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date
}
