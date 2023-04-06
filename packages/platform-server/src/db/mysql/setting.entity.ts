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

import { ObjectType, Field, registerEnumType, InputType } from '@nestjs/graphql'
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, RelationId, JoinColumn, BaseEntity, Index } from 'typeorm'

import type { Project } from './project.entity'
import { dbJSONTransformerFactory } from './utils'

export enum MessageTargetType {
  Issuer = 1,
  Specified,
}

export enum BundleMessageFilter {
  All = 1,
  Warning,
  None,
}

export enum BundleMessageSource {
  All = 1,
  Branch,
}

export enum LabMessageSource {
  All = 1,
  Warning,
  None,
}

registerEnumType(MessageTargetType, { name: 'MessageTargetType' })
registerEnumType(BundleMessageFilter, { name: 'BundleMessageFilter' })
registerEnumType(BundleMessageSource, { name: 'BundleMessageSource' })
registerEnumType(LabMessageSource, { name: 'LabMessageSource' })

@InputType('MessageTargetInput', { description: 'message target setting' })
@ObjectType({ description: 'message target setting' })
export class MessageTarget {
  @Field(() => [String])
  userEmails!: string[]
}

@ObjectType({ description: 'project setting' })
@Entity()
export class Setting extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Index()
  @Column()
  @RelationId('project')
  projectId!: number

  @OneToOne('Project', 'setting', { onDelete: 'CASCADE' })
  @JoinColumn()
  project!: Project

  @Field(() => BundleMessageSource, { description: 'what kind of source of bundle message would be sent' })
  @Column({
    type: 'tinyint',
    default: BundleMessageSource.All,
    comment: 'what kind of source of bundle message would be sent',
  })
  bundleMessageSource!: BundleMessageSource

  @Field(() => BundleMessageFilter, { description: 'what kind of bundle message would be sent' })
  @Column({
    type: 'tinyint',
    default: BundleMessageFilter.All,
    comment: 'what kind of bundle message would be sent',
  })
  bundleMessageFilter!: BundleMessageFilter

  @Field(() => [String], { description: 'branches where message should be sent if' })
  @Column({
    type: 'text',
    transformer: dbJSONTransformerFactory([]),
    nullable: true,
    comment: 'branches where message should be sent if',
  })
  bundleMessageBranches!: string[]

  /**
   * @deprecated
   */
  @Field(() => Boolean, {
    description: 'deprecated',
    deprecationReason: 'useless, enabled by default for all projects',
  })
  @Column({
    type: 'boolean',
    default: false,
    comment: 'Whether to enable the experimental feature of automatic source association',
  })
  autoDetectVersion!: boolean

  @Field(() => LabMessageSource, { description: 'what kind of lab message would be sent' })
  @Column({ type: 'tinyint', default: LabMessageSource.All, comment: 'what kind of lab message would be sent' })
  labMessageSource!: LabMessageSource

  @Field(() => MessageTargetType, { description: 'what kind of chat will receive message' })
  @Column({ type: 'tinyint', default: MessageTargetType.Issuer, comment: 'what kind of chat will receive message' })
  messageTargetType!: MessageTargetType

  @Field(() => MessageTarget, { description: 'who will receive message if target type is specified' })
  @Column({
    type: 'text',
    transformer: dbJSONTransformerFactory({ userEmails: [] }),
    nullable: true,
    comment: 'who will receive message if target type is specified',
  })
  messageTarget!: MessageTarget
}
