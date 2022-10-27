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

import { ObjectType, Field, Int } from '@nestjs/graphql'
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  RelationId,
  BeforeInsert,
  BaseEntity,
  OneToMany,
  Index,
} from 'typeorm'

import { CookieType as Cookie, HeaderType as Header, LocalStorageType as LocalStorage } from '@perfsee/shared'

import { ApplicationSetting } from './application-setting.entity'
import type { Project } from './project.entity'
import type { SnapshotReport } from './snapshot-report.entity'

@ObjectType()
export class HeaderType implements Header {
  @Field()
  key!: string

  @Field()
  value!: string

  @Field()
  host!: string
}

@ObjectType()
export class LocalStorageType implements LocalStorage {
  @Field(() => String)
  key!: string

  @Field(() => String)
  value!: string
}

@ObjectType()
export class CookieType implements Cookie {
  @Field()
  name!: string

  @Field()
  value!: string

  @Field()
  domain!: string

  @Field()
  path!: string

  @Field()
  httpOnly!: boolean

  @Field()
  secure!: boolean

  @Field({ nullable: true })
  expire!: string
}

@ObjectType({ description: 'project page asset' })
@Entity()
export class Page extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Field(() => Int, { name: 'id' })
  @Column({ type: 'int' })
  iid!: number

  @Field({ description: 'page alias name' })
  @Column()
  name!: string

  @Field({ description: 'page url' })
  @Column({ type: 'text', nullable: true })
  url!: string

  @Column()
  @Index()
  @RelationId('project')
  projectId!: number

  @ManyToOne('Project', 'pages', { onDelete: 'CASCADE' })
  project!: Project

  @Field(() => Boolean, { description: 'is competitor page' })
  @Column({ type: 'boolean', default: false })
  isCompetitor!: boolean

  @Field(() => Boolean, { description: 'is temporary page' })
  @Column({ type: 'boolean', default: false })
  isTemp!: boolean

  @Field(() => Boolean, { description: 'is e2e test' })
  @Column({ type: 'boolean', default: false })
  isE2e!: boolean

  @Field(() => String, { description: 'e2e script', nullable: true })
  @Column({ type: 'text', nullable: true })
  e2eScript!: string | null

  @Field(() => Boolean, {
    description: 'Disable scanning of this page',
  })
  @Column({ type: 'boolean', default: false })
  disable!: boolean

  @OneToMany('SnapshotReport', 'page')
  reports!: SnapshotReport[]
}

@ObjectType({ description: 'device information used to measure pages' })
@Entity()
export class Profile extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Field(() => Int, { name: 'id' })
  @Column({ type: 'int' })
  iid!: number

  @Field({ description: 'profile alias name' })
  @Column({ default: 'Desktop' })
  name!: string

  @Field({ description: 'simulator device name' })
  @Column({ default: 'no' })
  device!: string

  @Field({ description: 'bandwidth limit' })
  @Column({ default: 'no' })
  bandWidth!: string

  @ManyToOne('Project', 'profiles', { onDelete: 'CASCADE' })
  project!: Project

  @RelationId('project')
  @Column()
  @Index()
  projectId!: number

  @Field(() => Boolean, {
    description: 'Disable scanning of this profile',
  })
  @Column({ type: 'boolean', default: false })
  disable!: boolean

  @OneToMany('SnapshotReport', 'profile')
  reports!: SnapshotReport[]
}

@ObjectType({ description: 'environment used to measure pages' })
@Entity()
export class Environment extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Field(() => Int, { name: 'id' })
  @Column({ type: 'int' })
  iid!: number

  @Field({ description: 'environment alias name' })
  @Column()
  name!: string

  @Field(() => String, { description: 'the geo location where the related pages should be audited at' })
  @Column({ type: 'varchar', length: 50 })
  zone!: string

  @Field(() => [CookieType], { description: 'extra cookies add to requests' })
  @Column({ type: 'json', nullable: true })
  cookies!: CookieType[]

  @Field(() => [HeaderType], { description: 'extra headers add to requests' })
  @Column({ type: 'json', nullable: true })
  headers!: HeaderType[]

  @ManyToOne('Project', 'environments', { onDelete: 'CASCADE' })
  project!: Project

  @RelationId('project')
  @Column()
  @Index()
  projectId!: number

  @Field(() => Boolean, {
    deprecationReason: 'No need to use it',
    description: 'tells whether this environment could be used in temporary pages and competitor pages auditing',
  })
  @Column({ type: 'boolean', default: false })
  isCompetitor!: boolean

  @Field(() => Boolean, {
    description: 'Filtering environments when executing timed reminder tasks',
  })
  @Column({ type: 'boolean', default: false })
  needReminder!: boolean

  @Field(() => Boolean, {
    description: 'Disable scanning of this environment',
  })
  @Column({ type: 'boolean', default: false })
  disable!: boolean

  @Field(() => [LocalStorageType], {
    nullable: true,
    description: 'extra localStorage value inserted into page',
  })
  @Column({ type: 'json', nullable: true })
  localStorage!: LocalStorageType[]

  @OneToMany('SnapshotReport', 'environment')
  reports!: SnapshotReport[]

  @BeforeInsert()
  async updateCookiesAndHeaders() {
    if (!this.cookies) {
      this.cookies = []
    }
    if (!this.headers) {
      this.headers = []
    }

    if (!this.zone) {
      this.zone = await ApplicationSetting.defaultJobZone()
    }
  }
}
