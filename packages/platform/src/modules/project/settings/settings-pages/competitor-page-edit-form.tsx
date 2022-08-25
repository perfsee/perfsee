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

import { DialogFooter, PrimaryButton, DefaultButton } from '@fluentui/react'
import { useModuleState } from '@sigi/react'
import { isEqual } from 'lodash'
import { useCallback, useState, FormEvent } from 'react'

import { MultiSelector, RequiredTextField, URLTextField } from '@perfsee/components'

import { CompetitorMaxCount, PageRelation, PageSchema, PropertyModule, UpdatePagePayload } from '../../../shared'
import { disableSavePage, emptyRelation } from '../helper'

type FromProps = {
  defaultPage: Partial<PageSchema>
  closeModal: () => void
  onSubmit: (payload: UpdatePagePayload) => void
}

export const CompetitorPageEditForm = (props: FromProps) => {
  const { defaultPage, closeModal, onSubmit } = props

  const { environments, profiles, pages, pageRelationMap } = useModuleState(PropertyModule)
  const [page, setPage] = useState<Partial<PageSchema>>(defaultPage)
  const [connectPageId, setConnectPageId] = useState<number>()

  const defaultRelation = defaultPage.id ? pageRelationMap.get(defaultPage.id)! : emptyRelation

  const [relation, setRelation] = useState<Omit<PageRelation, 'pageId'>>(defaultRelation)

  const onChange = useCallback((e?: FormEvent<HTMLElement | HTMLInputElement>, value?: string | boolean) => {
    if (!e || value === undefined) {
      return
    }
    const type = (e.target as HTMLInputElement).dataset.type!
    setPage((page) => ({ ...page, [type]: value }))
  }, [])

  const onURLChange = useCallback((value?: string) => {
    setPage((page) => ({ ...page, url: value }))
  }, [])

  const onProfileChange = useCallback((ids: number[]) => {
    setRelation((rel) => ({ ...rel, profileIds: ids }))
  }, [])

  const onEnvChange = useCallback((ids: number[]) => {
    setRelation((rel) => ({ ...rel, envIds: ids }))
  }, [])

  const onConnectPageIdChange = useCallback((ids: number[]) => {
    const [id] = ids
    setConnectPageId(id)
  }, [])

  const onSaveButtonClick = useCallback(() => {
    if (page) {
      onSubmit({ page, connectPageId, relation })
    }
  }, [connectPageId, onSubmit, page, relation])

  return (
    <div>
      <RequiredTextField label="Page name" data-type="name" onChange={onChange} defaultValue={page.name} />
      <URLTextField required defaultValue={page.url} onChange={onURLChange} />
      <MultiSelector
        options={profiles}
        ids={relation.profileIds}
        onSelectChange={onProfileChange}
        label="Profiles"
        errorMessage="Profiles is required"
      />
      <MultiSelector
        options={environments.filter((e) => e.isCompetitor)}
        ids={relation.envIds}
        onSelectChange={onEnvChange}
        multiSelect={false}
        label="Environment"
        tips="Only one competitor environment can be selected on the competitor page."
        errorMessage="Environments is required"
      />
      {!defaultPage.id && (
        <MultiSelector
          options={pages.filter(
            (p) =>
              !p.isCompetitor &&
              !p.isTemp &&
              (pageRelationMap.get(p.id)?.competitorIds.length ?? 0) < CompetitorMaxCount,
          )}
          ids={connectPageId ? [connectPageId] : []}
          onSelectChange={onConnectPageIdChange}
          multiSelect={false}
          label="Connect Page"
          required={false}
          tips="Take a snapshot every time, the competitor page will be measured with the connect page at the same time for comparison."
        />
      )}
      <DialogFooter>
        <PrimaryButton
          onClick={onSaveButtonClick}
          text="Save"
          disabled={isEqual(page, defaultPage) && disableSavePage(page, relation)}
        />
        <DefaultButton onClick={closeModal} text="Cancel" />
      </DialogFooter>
    </div>
  )
}
