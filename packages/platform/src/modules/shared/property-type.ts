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

import { SettingPropertyQuery, PageRelationsQuery, PropertyQuery } from '@perfsee/schema'

export type PageSchema = PropertyQuery['project']['pages'][0]
export type ProfileSchema = PropertyQuery['project']['profiles'][0]
export type EnvSchema = PropertyQuery['project']['environments'][0]
export type ConnectionType = SettingPropertyQuery['connections'][0]
export type DeviceType = SettingPropertyQuery['devices'][0]
export type PageRelation = PageRelationsQuery['project']['pageRelations'][0]
export type CookieSchema = PropertyQuery['project']['environments'][0]['cookies'][0]
export type HeaderSchema = PropertyQuery['project']['environments'][0]['headers'][0]
export type LocalStorageSchema = NonNullable<PropertyQuery['project']['environments'][0]['localStorage']>[0]
export type SessionStorageSchema = NonNullable<PropertyQuery['project']['environments'][0]['sessionStorage']>[0]

export type UpdatePagePayload = {
  page: Partial<PageSchema>
  connectPageIds?: number[] // for competitor page
  relation: Omit<PageRelation, 'pageId'>
}

export const CompetitorMaxCount = 5

export enum DeleteProgress {
  None,
  Running,
  Done,
  Fail,
}
