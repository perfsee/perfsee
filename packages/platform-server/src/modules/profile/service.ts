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

import { Injectable } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { In } from 'typeorm'

import { DBService, InternalIdUsage, PageWithProfile, Profile } from '@perfsee/platform-server/db'
import { InternalIdService } from '@perfsee/platform-server/helpers'
import { Logger } from '@perfsee/platform-server/logger'
import { createDataLoader } from '@perfsee/platform-server/utils'

import { SnapshotReportService } from '../snapshot/snapshot-report/service'

import { UpdateProfileInput } from './types'

@Injectable()
export class ProfileService {
  loader = createDataLoader((ids: number[]) =>
    Profile.findBy({
      id: In(ids),
    }),
  )

  constructor(
    private readonly db: DBService,
    private readonly moduleRef: ModuleRef,
    private readonly internalIdService: InternalIdService,
    private readonly logger: Logger,
  ) {}

  getProfiles(projectId: number) {
    return Profile.findBy({ projectId })
  }

  getProfile(projectId: number, iid: number) {
    return Profile.findOneByOrFail({ projectId, iid })
  }

  async updateProfile(projectId: number, patch: UpdateProfileInput) {
    if (!patch.iid) {
      const iid = await this.internalIdService.generate(projectId, InternalIdUsage.Profile)
      patch.iid = iid
      return Profile.create({ ...patch, iid, projectId }).save() // create
    }
    const profile = await Profile.findOneByOrFail({ projectId, iid: patch.iid })
    return Profile.create<Profile>({ ...profile, ...patch }).save() // update
  }

  async deleteProfile(profile: Profile) {
    const { id, projectId, name } = profile

    this.logger.log('start delete profile', { id, projectId, name })
    await this.db.transaction(async (manager) => {
      await this.moduleRef
        .get(SnapshotReportService, { strict: false })
        .deleteSnapshotsReports(manager, { profileId: id })
      await manager.getRepository(PageWithProfile).delete({ profileId: id })
      await manager.remove(profile)
    })
  }
}
