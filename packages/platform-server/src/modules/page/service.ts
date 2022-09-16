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
import { difference, isNil, omit, omitBy } from 'lodash'
import { EntityManager, In } from 'typeorm'

import {
  Page,
  PageWithEnv,
  PageWithProfile,
  PageWithCompetitor,
  InternalIdUsage,
  DBService,
  Profile,
  Environment,
} from '@perfsee/platform-server/db'
import { UserError } from '@perfsee/platform-server/error'
import { InternalIdService } from '@perfsee/platform-server/helpers'
import { Logger } from '@perfsee/platform-server/logger'
import { createDataLoader } from '@perfsee/platform-server/utils'

import { SnapshotReportService } from '../snapshot/snapshot-report/service'

import { CreatePageInput, PageInput, UpdatePageInput } from './types'

type PagePropertySchema = {
  pageId: number
  envId: number
  profileId: number
}

@Injectable()
export class PageService {
  loader = createDataLoader((ids: number[]) =>
    Page.findBy({
      id: In(ids),
    }),
  )

  constructor(
    private readonly db: DBService,
    private readonly moduleRef: ModuleRef,
    private readonly internalIdService: InternalIdService,
    private readonly logger: Logger,
  ) {}

  async getPages(projectId: number) {
    return Page.findBy({ projectId })
  }

  getPage(projectId: number, iid: number) {
    return Page.findOneByOrFail({ projectId, iid })
  }

  async getPageRelations(projectId: number) {
    const pages = await Page.findBy({ projectId, isTemp: false })

    if (!pages.length) {
      return []
    }

    const pageMap = new Map<number /**id */, number /**iid */>()
    for (const page of pages) {
      pageMap.set(page.id, page.iid)
    }

    const pageIds = pages.map((p) => p.id)
    const profileMap = await this.getProfileIidMapByPageIds(pageIds)
    const envMap = await this.getEnvIidMapByPageIds(pageIds)
    const competitorMap = await this.getCompetitorIidMapByPageIds(pageIds)

    return pageIds.map((id) => {
      return {
        pageId: pageMap.get(id)!,
        profileIds: profileMap.get(id) ?? [],
        envIds: envMap.get(id) ?? [],
        competitorIds: competitorMap.get(id) ?? [],
      }
    })
  }

  async getPageWithProperty(
    projectId: number,
    pageIids?: number[],
    profileIids?: number[],
    envIids?: number[],
  ): Promise<{ pages: Page[]; envs: Environment[]; profiles: Profile[]; propertyIds: PagePropertySchema[] }> {
    const pageConditions = {
      projectId,
      isCompetitor: false,
      isTemp: false,
      disable: false,
    }

    if (pageIids?.length) {
      pageConditions['iid'] = In(pageIids)
    }

    const pages = await Page.findBy<Page>(pageConditions)

    if (!pages.length) {
      return { pages: [], envs: [], profiles: [], propertyIds: [] }
    }

    const pageIds = pages.map((p) => p.id)
    const profiles = await Profile.findBy({ projectId, disable: false })
    const envs = await Environment.findBy({ projectId, disable: false })
    const validEnvIdSet = this.getValidIdSet(envs, envIids)
    const validProfileIdSet = this.getValidIdSet(profiles, profileIids)

    const propertyIds: PagePropertySchema[] = []

    // user specifies pages and envs and profiles
    // so we will just ignore the predefined Page x Env x Profile bindings
    if (pageIids?.length && envIids?.length && profileIids?.length) {
      pages.forEach((page) => {
        envs.forEach((env) => {
          if (!validEnvIdSet.has(env.id)) {
            return
          }
          profiles.forEach((profile) => {
            if (!validProfileIdSet.has(profile.id)) {
              return
            }

            propertyIds.push({
              pageId: page.id,
              envId: env.id,
              profileId: profile.id,
            })
          })
        })
      })
    } else {
      const pageEnvs = await PageWithEnv.findBy({ pageId: In(pageIds) })
      const pageProfiles = await PageWithProfile.findBy({ pageId: In(pageIds) })

      pageEnvs.forEach(({ pageId, envId }) => {
        pageProfiles.forEach(({ pageId: pageId2, profileId }) => {
          if (pageId === pageId2 && validEnvIdSet.has(envId) && validProfileIdSet.has(profileId)) {
            propertyIds.push({
              pageId,
              profileId,
              envId,
            })
          }
        })
      })
    }

    let competitorIds = await PageWithCompetitor.createQueryBuilder()
      .where('page_id in (:...pageIds)', { pageIds: pageIds })
      .select('competitor_id')
      .getRawMany<{ competitor_id: number }>()
      .then((rows) => rows.map(({ competitor_id }) => competitor_id))

    if (competitorIds.length) {
      const competitorPages = await Page.findBy({
        id: In(competitorIds),
        disable: false,
      })

      if (competitorPages.length) {
        competitorIds = competitorPages.map((p) => p.id)
        pages.push(...competitorPages)
        const pageEnvs = await PageWithEnv.findBy({ pageId: In(competitorIds) })
        const pageProfiles = await PageWithProfile.findBy({ pageId: In(competitorIds) })
        pageEnvs.forEach(({ pageId, envId }) => {
          pageProfiles.forEach(({ pageId: pageId2, profileId }) => {
            if (pageId === pageId2) {
              propertyIds.push({
                pageId,
                profileId,
                envId,
              })
            }
          })
        })
      }
    }

    return { pages, envs, profiles, propertyIds }
  }

  async updateOrCreatePage(projectId: number, input: PageInput) {
    // change iid to id
    if (input.profileIids?.length) {
      const profiles = await Profile.findBy({ projectId, iid: In(input.profileIids) })
      input.profileIids = profiles.map((p) => p.id)
    }

    if (input.envIids?.length) {
      const envs = await Environment.findBy({ projectId, iid: In(input.envIids) })
      input.envIids = envs.map((e) => e.id)
    }

    if (input.competitorIids?.length) {
      const pages = await Page.findBy({ projectId, iid: In(input.competitorIids) })
      input.competitorIids = pages.map((p) => p.id)
    }

    if (input.connectPageIid) {
      const page = await Page.findOneByOrFail({ projectId, iid: input.connectPageIid })
      input.connectPageIid = page.id
    }

    if ('iid' in input) {
      return this.updatePage(projectId, input)
    } else {
      return this.createPage(projectId, input)
    }
  }

  async deletePage(page: Page) {
    const { id, projectId, name } = page

    this.logger.log('start delete page', { id, projectId, name })
    await this.db.transaction(async (manager) => {
      await this.moduleRef.get(SnapshotReportService, { strict: false }).deleteSnapshotsReports(manager, { pageId: id })

      await manager.getRepository(PageWithEnv).delete({ pageId: id })
      await manager.getRepository(PageWithProfile).delete({ pageId: id })
      if (page.isCompetitor) {
        await manager.getRepository(PageWithCompetitor).delete({ competitorId: id })
      } else {
        await manager.getRepository(PageWithCompetitor).delete({ pageId: id })
      }
      await manager.remove(page)
    })
  }

  async createPage(projectId: number, input: CreatePageInput) {
    if (!input.url || !input.name) {
      throw new UserError(`Required parameters: 'url' and 'name'`)
    }

    const existed = await Page.countBy({ url: input.url, projectId })

    if (existed) {
      throw new UserError(`The url ${input.url} exists in this project`)
    }

    const payload = omit(input, 'profileIids', 'envIids', 'competitorIids', 'connectPageIid')
    const page = Page.create({
      ...payload,
      projectId,
      iid: await this.internalIdService.generate(projectId, InternalIdUsage.Page),
    })

    await this.db.transaction(async (manager) => {
      await manager.getRepository(Page).insert(page)

      await this.savePageWithProfiles(manager, page.id, input.profileIids, true)
      await this.savePageWithEnvironments(manager, page.id, input.envIids, true)

      if (!input.isCompetitor && !page.isTemp) {
        await this.savePageWithCompetitors(manager, page.id, input.competitorIids, true)
      }

      if (input.connectPageIid && input.isCompetitor) {
        await manager.getRepository(PageWithCompetitor).save({ pageId: input.connectPageIid, competitorId: page.id })
      }
    })
    return page
  }

  async updatePage(projectId: number, patch: UpdatePageInput) {
    const page = await Page.findOneByOrFail({ projectId, iid: patch.iid })

    if (patch.url) {
      const existed = await Page.findOneBy({ url: patch.url, projectId })
      if (existed && existed.id !== page.id) {
        throw new UserError(`The url ${patch.url} exists in this project`)
      }
    }
    const payload = omit(omitBy(patch, isNil), 'profileIids', 'envIids', 'competitorIids')

    await this.db.transaction(async (manager) => {
      await manager.getRepository(Page).update(page.id, payload)
      await this.savePageWithProfiles(manager, page.id, patch.profileIids ?? [])
      await this.savePageWithEnvironments(manager, page.id, patch.envIids ?? [])
      if (!page.isCompetitor && !page.isTemp) {
        await this.savePageWithCompetitors(manager, page.id, patch.competitorIids ?? [])
      }
    })

    return { ...page, ...payload }
  }

  private async savePageWithProfiles(
    manager: EntityManager,
    pageId: number,
    profileIds: number[],
    isNewPage?: boolean,
  ) {
    const oldProfileIds = isNewPage ? [] : (await PageWithProfile.findBy({ pageId })).map((item) => item.profileId)
    const needRemoveProfileIds = difference(oldProfileIds, profileIds)
    const needAddProfileIds = difference(profileIds, oldProfileIds)

    if (needRemoveProfileIds.length) {
      await manager
        .getRepository(PageWithProfile)
        .createQueryBuilder()
        .delete()
        .where('page_id = :pageId', { pageId })
        .andWhere('profile_id in (:...profileIds)', { profileIds: needRemoveProfileIds })
        .execute()
    }

    if (needAddProfileIds.length) {
      const addItems = needAddProfileIds.map((id) => {
        return PageWithProfile.create({ pageId, profileId: id })
      })
      await manager.getRepository(PageWithProfile).insert(addItems)
    }
  }

  private async savePageWithEnvironments(
    manager: EntityManager,
    pageId: number,
    envIds: number[],
    isNewPage?: boolean,
  ) {
    const oldEnvIds = isNewPage ? [] : (await PageWithEnv.findBy({ pageId })).map((item) => item.envId)
    const needRemoveEnvIds = difference(oldEnvIds, envIds)
    const needAddEnvIds = difference(envIds, oldEnvIds)

    if (needRemoveEnvIds.length) {
      await manager
        .getRepository(PageWithEnv)
        .createQueryBuilder()
        .delete()
        .where('page_id = :pageId', { pageId })
        .andWhere('env_id in (:...envIds)', { envIds: needRemoveEnvIds })
        .execute()
    }

    if (needAddEnvIds.length) {
      const addItems = needAddEnvIds.map((id) => {
        return PageWithEnv.create({ pageId, envId: id })
      })
      await manager.getRepository(PageWithEnv).insert(addItems)
    }
  }

  private async savePageWithCompetitors(
    manager: EntityManager,
    pageId: number,
    competitorIds: number[],
    isNewPage?: boolean,
  ) {
    const oldCompetitorIds = isNewPage
      ? []
      : (await PageWithCompetitor.findBy({ pageId })).map((item) => item.competitorId)
    const needRemoveComIds = difference(oldCompetitorIds, competitorIds)
    const needAddComIds = difference(competitorIds, oldCompetitorIds)
    if (needRemoveComIds.length) {
      await manager
        .getRepository(PageWithCompetitor)
        .createQueryBuilder()
        .delete()
        .where('page_id = :pageId', { pageId })
        .andWhere('competitor_id in (:...ids)', { ids: needRemoveComIds })
        .execute()
    }

    if (needAddComIds.length) {
      const addItems = needAddComIds.map((id) => {
        return PageWithCompetitor.create({ pageId, competitorId: id })
      })
      await manager.getRepository(PageWithCompetitor).insert(addItems)
    }
  }

  private async getProfileIidMapByPageIds(pageIds: number[]) {
    const withProfiles = await PageWithProfile.createQueryBuilder('item')
      .leftJoin(Profile, 'profile', 'profile.id = item.profile_id')
      .select(['profile.iid as profileId', 'item.pageId as pageId'])
      .where('item.page_id in (:...pageIds)', { pageIds })
      .getRawMany<{ pageId: number; profileId: number }>()

    const map = new Map<number, number[]>() // <pageId, profileIds>

    withProfiles.forEach(({ pageId, profileId }) => {
      const ids = map.get(pageId) ?? []
      map.set(pageId, [...ids, profileId])
    })

    return map
  }

  private async getEnvIidMapByPageIds(pageIds: number[]) {
    const withEnv = await PageWithEnv.createQueryBuilder('item')
      .leftJoin(Environment, 'environment', 'environment.id = item.env_id')
      .select(['environment.iid as envId', 'item.pageId as pageId'])
      .where('item.page_id in (:...pageIds)', { pageIds })
      .getRawMany<{ pageId: number; envId: number }>()

    const map = new Map<number, number[]>() // <pageId, envIds>

    withEnv.forEach(({ pageId, envId }) => {
      const ids = map.get(pageId) ?? []
      map.set(pageId, [...ids, envId])
    })

    return map
  }

  private async getCompetitorIidMapByPageIds(pageIds: number[]) {
    const withCompetitor = await PageWithCompetitor.createQueryBuilder('item')
      .leftJoin(Page, 'page', 'page.id = item.competitor_id')
      .select(['page.iid as competitorId', 'item.pageId as pageId'])
      .where('item.page_id in (:...pageIds)', { pageIds })
      .getRawMany<{ pageId: number; competitorId: number }>()

    const map = new Map<number, number[]>() // <pageId, competitorIds>

    withCompetitor.forEach(({ pageId, competitorId }) => {
      const ids = map.get(pageId) ?? []
      map.set(pageId, [...ids, competitorId])
    })

    return map
  }

  private getValidIdSet(list: { id: number; iid: number }[], iids?: number[]) {
    if (iids?.length) {
      const validSet = new Set<number>()
      const iidSet = new Set(iids)
      list.forEach((item) => {
        if (iidSet.has(item.iid)) {
          validSet.add(item.id)
        }
      })
      return validSet
    }

    return new Set(list.map((item) => item.id))
  }
}
