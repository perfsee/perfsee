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

import { TooltipHost } from '@fluentui/react'
import { useModuleState } from '@sigi/react'
import { compact } from 'lodash'
import { FC } from 'react'

import { PageSchema, PropertyModule } from '@perfsee/platform/modules/shared'

import { ButtonOperators, PagePropertyItem, PagePropertyType } from '../settings-common-comp'
import { EllipsisText } from '../style'

import {
  PageCard,
  PageCardTop,
  PageHeaderInfo,
  PageHeaderLink,
  PageHeaderWrap,
  PageIcon,
  PageInfos,
  PageName,
  Tag,
} from './style'
import WebIcon from './web.svg'

type Props = {
  page: PageSchema
  openDeleteModal: (page: PageSchema) => void
  openEditModal: (page: PageSchema) => void
  onClickRestore: (page: PageSchema) => void
  onClickDisable: (page: PageSchema) => void
}

export const PageListCell: FC<Props> = (props) => {
  const { page } = props
  const { pageRelationMap, pageMap, profileMap, envMap } = useModuleState(PropertyModule, {
    selector: (state) => ({
      pageRelationMap: state.pageRelationMap,
      pageMap: state.pageMap,
      profileMap: state.profileMap,
      envMap: state.envMap,
    }),
    dependencies: [],
  })

  const relation = pageRelationMap.get(page.id)
  if (!relation) {
    return null
  }

  const envs = compact(relation.envIds.map((envId) => envMap.get(envId)?.name))
  const profiles = compact(relation.profileIds.map((profileId) => profileMap.get(profileId)?.name))
  const competitors = compact(relation.competitorIds.map((pageId) => pageMap.get(pageId)?.name))

  return (
    <PageCard>
      <PageCardTop>
        <PageIcon>
          <WebIcon />
        </PageIcon>
        <PageInfos>
          <EllipsisText>
            <PageHeader warning={!envs.length || !profiles.length} item={page} disable={page.disable} />
            <div>
              {/* <PagePropertyItem type={PagePropertyType.Link} value={page.url} /> */}
              <PagePropertyItem type={PagePropertyType.Environment} value={envs.join(',') || '-'} />
              <PagePropertyItem type={PagePropertyType.Profile} value={profiles.join(',') || '-'} />
              <PagePropertyItem type={PagePropertyType.Competitor} value={competitors.join(',')} />
            </div>
          </EllipsisText>
        </PageInfos>
      </PageCardTop>
      <ButtonOperators
        item={page}
        clickDeleteButton={props.openDeleteModal}
        clickEditButton={props.openEditModal}
        clickDisableButton={props.onClickDisable}
        clickRestoreButton={props.onClickRestore}
        showDisableButton={!page.disable}
        showRestoreButton={page.disable}
      />
    </PageCard>
  )
}

const PageHeader: FC<{ item: PageSchema; warning: boolean; disable: boolean }> = ({ item, warning, disable }) => {
  return (
    <PageHeaderWrap>
      <PageHeaderInfo>
        <PageName>
          <TooltipHost content={item.name}>{item.name}</TooltipHost>
        </PageName>
        {warning && (
          <TooltipHost content="This page is unavailable because of missing environment or profile.">
            <Tag type="error">Error</Tag>
          </TooltipHost>
        )}
        {disable && <Tag type="default">Disabled</Tag>}
      </PageHeaderInfo>
      <PageHeaderLink>{item.url}</PageHeaderLink>
    </PageHeaderWrap>
  )
}
