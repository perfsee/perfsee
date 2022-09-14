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
import GraphQLJSON from 'graphql-type-json'
import { Column, Entity, PrimaryGeneratedColumn, BaseEntity, RelationId, OneToOne, JoinColumn, Index } from 'typeorm'

import type { Project } from './project.entity'
import { dbJSONTransformerFactory } from './utils'

export enum ScheduleType {
  Off = 1,
  Daily,
  Hourly,
  EveryXHour,
}

export enum ScheduleMonitorType {
  All = 1,
  Specified,
}

registerEnumType(ScheduleType, { name: 'ScheduleType' })
registerEnumType(ScheduleMonitorType, { name: 'ScheduleMonitorType' })

@ObjectType({ description: 'snapshot measuring cornjob' })
@Entity()
export class Timer extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Index()
  @Column()
  @RelationId('project')
  projectId!: number

  @OneToOne('Project', 'timer', { onDelete: 'CASCADE' })
  @JoinColumn()
  project!: Project

  @Field(() => ScheduleType, { description: 'schedule type' })
  @Column({ type: 'tinyint', default: ScheduleType.Off })
  schedule!: ScheduleType

  @Field(() => Int, { nullable: true, description: 'Every x hour' })
  @Column({ type: 'tinyint', nullable: true })
  hour!: number | null

  @Field(() => Int, { nullable: true, description: 'Time of day' })
  @Column({ type: 'tinyint', nullable: true })
  timeOfDay!: number | null

  @Field(() => GraphQLISODateTime, { description: 'next evaluation time of this schedule task' })
  @Column({ type: 'timestamp' })
  nextTriggerTime!: Date

  @Field(() => GraphQLJSON, { description: 'related page ids' })
  @Column('text', { transformer: dbJSONTransformerFactory([]), nullable: true })
  pageIds!: number[]

  @Field(() => GraphQLJSON, { description: 'related profile ids' })
  @Column('text', { transformer: dbJSONTransformerFactory([]), nullable: true })
  profileIds!: number[]

  @Field(() => GraphQLJSON, { description: 'related environment ids' })
  @Column('text', { transformer: dbJSONTransformerFactory([]), nullable: true })
  envIds!: number[]

  @Field(() => ScheduleMonitorType, {
    description: 'whether only specific pages/profiles/envs will be measured when task triggered',
  })
  @Column({ type: 'tinyint', default: ScheduleMonitorType.All })
  monitorType!: ScheduleMonitorType
}
