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

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  RelationId,
  Index,
  JoinColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm'

import { Project } from './project.entity'

@Entity()
export class ProjectJobUsage extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Column()
  @Index()
  @RelationId('project')
  projectId!: number

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn()
  project!: Project

  @Column()
  year!: number

  @Column()
  month!: number

  @Column({ default: 0 })
  jobCount!: number

  @Column({ default: 0, type: 'decimal', precision: 10, scale: 2 })
  jobDuration!: string

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date
}
