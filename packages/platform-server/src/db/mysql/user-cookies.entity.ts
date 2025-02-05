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
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm'
import { User } from './user.entity'

@Entity()
export class UserCookies extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Column({ type: 'int' })
  @Index()
  @RelationId('user')
  userId!: number

  @ManyToOne('User', 'cookies', { onDelete: 'CASCADE' })
  user!: User

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date

  @Column({ type: 'varchar', length: 255, nullable: true })
  cookieStorageKey!: string | null
}
