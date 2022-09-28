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

import { Field, ObjectType } from '@nestjs/graphql'
import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, BaseEntity } from 'typeorm'

@ObjectType()
@Entity()
export class ApplicationSetting extends BaseEntity {
  static async defaultJobZone() {
    return (
      await ApplicationSetting.findOneOrFail({
        select: {
          defaultJobZone: true,
        },
        where: {
          id: 1,
        },
      })
    ).defaultJobZone
  }

  @PrimaryGeneratedColumn('increment')
  id!: number

  @Column({ type: 'varchar' })
  registrationToken!: string

  @Column({ default: true })
  @Field()
  enableSignup!: boolean

  @Column({ default: false })
  @Field()
  enableOauth!: boolean

  @Column({ default: true })
  @Field()
  enableProjectCreate!: boolean

  @Column({ default: true })
  @Field()
  enableProjectDelete!: boolean

  @Column({ default: false })
  @Field()
  enableProjectImport!: boolean

  @Column({ default: false })
  enableEmail!: boolean

  @Column({ default: false })
  userEmailConfirmation!: boolean

  @Column({ type: 'json', nullable: true })
  jobZones!: string[]

  @Column({ type: 'varchar', length: 50 })
  defaultJobZone!: string

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date

  save() {
    return super.save({ reload: false })
  }
}
