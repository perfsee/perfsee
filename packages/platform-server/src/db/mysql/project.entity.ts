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

import { ObjectType, Field, registerEnumType, ID } from '@nestjs/graphql'
import { GitHost } from '@perfsee/shared'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  BaseEntity,
  Index,
  OneToMany,
  OneToOne,
  ManyToOne,
  JoinColumn,
  RelationId,
} from 'typeorm'

import type { AppVersion } from './app-version.entity'
import type { Artifact } from './artifact.entity'
import type { Job } from './job.entity'
import { ProjectJobUsage } from './project-usage-job.entity'
import { UsagePack } from './usage-pack.entity'
import type { Environment, Page, Profile } from './property.entity'
import type { ScriptFile } from './script-file.entity'
import type { Setting } from './setting.entity'
import type { SnapshotReport } from './snapshot-report.entity'
import type { Snapshot } from './snapshot.entity'
import type { SourceIssue } from './source-issue.entity'
import type { Timer } from './timer.entity'
import type { UserPermission } from './user-permission.entity'
import type { Webhook } from './webhook.entity'

registerEnumType(GitHost, { name: 'GitHost' })

@ObjectType()
@Entity()
export class Project extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Field(() => ID, {
    name: 'id',
    description: 'project unique id, contains only lowercase letters "a-z", numbers "0-9", hyphen "-", underscore "_"',
  })
  @Column({ type: 'varchar', length: 100 })
  @Index({ unique: true })
  slug!: string

  @Field({
    description: 'repository namespace',
  })
  @Column()
  namespace!: string

  @Field({
    description: 'repository name',
  })
  @Column()
  name!: string

  @Field(() => GitHost, { description: 'repository remote host' })
  @Column({ type: 'varchar' })
  host!: GitHost

  @Field({ description: 'artifact baseline branch name' })
  @Column({ default: 'master' })
  artifactBaselineBranch!: string

  @Field(() => Boolean, { description: 'is the project public to everyone' })
  @Column({ type: 'boolean', default: false })
  isPublic!: boolean

  @Column({ nullable: true })
  @RelationId('usagePack')
  usagePackId!: number

  @ManyToOne('UsagePack', 'projects')
  @JoinColumn()
  usagePack!: UsagePack

  @Field({ description: 'project created timestamp' })
  @CreateDateColumn()
  createdAt!: Date

  @OneToMany('Page', 'project')
  pages!: Page[]

  @OneToMany('Environment', 'project')
  environments!: Environment[]

  @OneToMany('Profile', 'project')
  profiles!: Profile[]

  @OneToMany('AppVersion', 'project')
  appVersions!: AppVersion[]

  @OneToMany('Artifact', 'project')
  artifacts!: Artifact

  @OneToMany('Snapshot', 'project')
  snapshots!: Snapshot[]

  @OneToMany('SnapshotReport', 'project')
  snapshotReports!: SnapshotReport[]

  @OneToMany('Job', 'project')
  jobs!: Job[]

  @OneToMany('SourceIssue', 'project')
  sourceIssues!: SourceIssue[]

  @OneToMany('UserPermission', 'project')
  permissions!: UserPermission[]

  @OneToMany('ScriptFile', 'project')
  scriptFiles!: ScriptFile[]

  @OneToOne('Timer', 'project')
  timer!: Timer

  @OneToOne('Setting', 'project')
  setting!: Setting

  @OneToMany('ProjectJobUsage', 'project')
  jobUsage!: ProjectJobUsage

  @OneToMany('Webhook', 'project')
  webhooks!: Webhook[]

  static findOneByIdSlug(idOrSlug: string | number) {
    return this.findOne({
      where: typeof idOrSlug === 'number' || idOrSlug.match(/^\d+$/) ? { id: Number(idOrSlug) } : { slug: idOrSlug },
    })
  }
}
