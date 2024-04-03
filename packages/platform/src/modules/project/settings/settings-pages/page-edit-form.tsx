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

import { DialogFooter, PrimaryButton, DefaultButton, Stack } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useCallback, useState, useMemo, useRef } from 'react'

import { MultiSelector, RequiredTextField, URLTextField } from '@perfsee/components'

import { CompetitorMaxCount, PageRelation, PageSchema, PropertyModule, UpdatePagePayload } from '../../../shared'
import { disableSavePage, emptyRelation } from '../helper'

import { UserflowScriptForm } from './userflow-script-form'

type FromProps = {
  defaultPage: Partial<PageSchema>
  closeModal: () => void
  onSubmit: (payload: UpdatePagePayload) => void
}

export const PageEditForm = (props: FromProps) => {
  const { defaultPage, closeModal, onSubmit } = props

  const userflowScriptRef = useRef<{ getScript: () => string | null }>()
  const [{ environments, profiles, pages, pageRelationMap }] = useModule(PropertyModule)

  const [page, setPage] = useState<Partial<PageSchema>>(defaultPage) // for record edit or delete page

  const defaultRelation = defaultPage.id ? pageRelationMap.get(defaultPage.id)! : emptyRelation
  const [relation, setRelation] = useState<Omit<PageRelation, 'pageId'>>(defaultRelation)

  const onChange = useCallback((e?: any, value?: string | boolean) => {
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

  const onCompetitorChange = useCallback((ids: number[]) => {
    if (ids.length > CompetitorMaxCount) {
      return
    }
    setRelation((rel) => ({ ...rel, competitorIds: ids }))
  }, [])

  const onEnvChange = useCallback((ids: number[]) => {
    setRelation((rel) => ({ ...rel, envIds: ids }))
  }, [])

  const onSaveButtonClick = useCallback(() => {
    if (page) {
      const userflowScript = userflowScriptRef.current!.getScript()
      if (userflowScript === '') {
        return
      }
      onSubmit({ page: { ...page, isE2e: !!userflowScript, e2eScript: userflowScript }, relation })
    }
  }, [onSubmit, page, relation])

  const competitorPageItems = useMemo(() => {
    return pages
      .filter((p) => p.isCompetitor)
      .map((e) => ({ id: e.id, name: !e.disable ? e.name : e.name + ' (disabled)' }))
  }, [pages])

  const environmentItems = useMemo(
    () => environments.map((e) => ({ id: e.id, name: !e.disable ? e.name : e.name + ' (disabled)' })),
    [environments],
  )

  const profileItems = useMemo(
    () => profiles.map((e) => ({ id: e.id, name: !e.disable ? e.name : e.name + ' (disabled)' })),
    [profiles],
  )

  return (
    <Stack tokens={{ childrenGap: 6 }}>
      <RequiredTextField label="Page name" data-type="name" onChange={onChange} defaultValue={page.name} />
      <URLTextField required defaultValue={page.url} onChange={onURLChange} />
      <MultiSelector
        options={profileItems}
        ids={relation.profileIds}
        onSelectChange={onProfileChange}
        label="Profiles"
        errorMessage="Required"
      />
      <MultiSelector
        options={environmentItems}
        ids={relation.envIds}
        onSelectChange={onEnvChange}
        label="Environments"
        errorMessage="Required"
      />
      {!!competitorPageItems.length && (
        <MultiSelector
          options={competitorPageItems}
          ids={relation.competitorIds}
          onSelectChange={onCompetitorChange}
          required={false}
          label="Competitor Page"
          tips={`Every time the page performance got measured,
          the competitor page will be measured at the same time for comparison.
          The maximum number of competitors is ${CompetitorMaxCount}.`}
        />
      )}
      <UserflowScriptForm defaultScript={page.e2eScript} ref={userflowScriptRef} />

      <DialogFooter>
        <PrimaryButton onClick={onSaveButtonClick} text="Save" disabled={disableSavePage(page, relation)} />
        <DefaultButton onClick={closeModal} text="Cancel" />
      </DialogFooter>
    </Stack>
  )
}
