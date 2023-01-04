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

import { Entity, ManyToOne, Column, RelationId, PrimaryGeneratedColumn, BaseEntity, Index } from 'typeorm'

import type { Project } from './project.entity'
import type { Group } from './group.entity'

@Entity()
export class ProjectGroup extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Column()
  @RelationId('project')
  projectId!: number

  @ManyToOne('Project', 'projectInGroups', { onDelete: 'CASCADE' })
  project!: Project

  @Column()
  @Index()
  @RelationId('group')
  groupId!: number

  @ManyToOne('Group', 'projectInGroups', { onDelete: 'CASCADE' })
  group!: Group
}
