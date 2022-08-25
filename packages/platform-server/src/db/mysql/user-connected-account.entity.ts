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

import { registerEnumType } from '@nestjs/graphql'
import { BaseEntity, Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn, RelationId } from 'typeorm'

import { ExternalAccount } from '@perfsee/shared'

import type { User } from './user.entity'

@Entity()
export class UserConnectedAccount extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Column()
  @Index()
  @RelationId('user')
  userId!: number

  @ManyToOne('User', 'connectedAccounts')
  user!: User

  @Column({ type: 'varchar' })
  provider!: ExternalAccount

  @Column({ type: 'varchar' })
  externUsername!: string

  @Column({ type: 'varchar' })
  accessToken!: string
}

registerEnumType(ExternalAccount, { name: 'ExternalAccount' })
