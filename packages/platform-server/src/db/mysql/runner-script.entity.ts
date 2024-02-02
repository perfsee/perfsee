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
import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@ObjectType({ description: 'runner script' })
@Entity()
export class RunnerScript extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Column({ type: 'varchar' })
  @Field(() => String, { description: 'runner script version, follow the semantic versioning spec' })
  version!: string

  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  description!: string | null

  @Column({ type: 'varchar' })
  @Field(() => String)
  sha256!: string

  @Column({ type: 'varchar' })
  @Field(() => String)
  jobType!: string

  @Column({ type: 'varchar' })
  @Field(() => String, { description: 'runner script zipped package key in storage' })
  storageKey!: string

  @Column({ type: 'int' })
  @Field(() => Number, { description: 'size in bytes' })
  size!: number

  @CreateDateColumn({ type: 'timestamp' })
  @Field(() => GraphQLISODateTime, { description: 'created timestamp' })
  createdAt!: Date

  @Column({ type: 'boolean' })
  @Field(() => Boolean)
  enable!: boolean
}
