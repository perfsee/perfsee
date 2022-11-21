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

import { Field, GraphQLISODateTime, ObjectType } from '@nestjs/graphql'
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  CreateDateColumn,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm'

import type { Project } from './project.entity'

@Entity()
@ObjectType()
export class UsagePack extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Field({ description: 'name of the usage pack' })
  @Column()
  name!: string

  @Field()
  @Column()
  desc!: string

  @Column({ default: false })
  @Field({ description: 'whether the usage pack is public' })
  isPublic!: boolean

  @Column({ default: false })
  @Field({ description: 'whether the usage pack is default' })
  isDefault!: boolean

  @Field({ description: 'job count quota within one month, -1 means no limit' })
  @Column()
  jobCountMonthly!: number

  @Field({ description: 'job cost duration time quota within one month, in minute, -1 means no limit' })
  @Column()
  jobDurationMonthly!: number

  @Field({ description: 'total storage quota, in MB, -1 means no limit' })
  @Column()
  storage!: number

  @Field(() => GraphQLISODateTime)
  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date

  @Field(() => GraphQLISODateTime)
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date

  @OneToMany('Project', 'usagePack')
  projects!: Project[]
}
