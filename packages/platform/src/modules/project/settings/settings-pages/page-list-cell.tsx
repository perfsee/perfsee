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

import { Icon, SharedColors, Stack, TooltipHost } from '@fluentui/react'
import { useModuleState } from '@sigi/react'
import { FC } from 'react'

import { PageSchema, PropertyModule } from '@perfsee/platform/modules/shared'

import { ButtonOperators, CountBlock } from '../settings-common-comp'
import { EllipsisText, NormalToken, StyledDesc } from '../style'

type Props = {
  page: PageSchema
  openDeleteModal: (page: PageSchema) => void
  openEditModal: (page: PageSchema) => void
  onClickRestore: (page: PageSchema) => void
  onClickDisable: (page: PageSchema) => void
}

export const PageListCell: FC<Props> = (props) => {
  const { page } = props
  const pageRelationMap = useModuleState(PropertyModule, {
    selector: (state) => state.pageRelationMap,
    dependencies: [],
  })

  const relation = pageRelationMap.get(page.id)
  if (!relation) {
    return null
  }
  const envCount = relation.envIds.length
  const profileCount = relation.profileIds.length
  const competitorCount = relation.competitorIds.length

  return (
    <Stack tokens={NormalToken} horizontal horizontalAlign="space-between" verticalAlign="center">
      <EllipsisText>
        <PageHeader warning={!envCount || !profileCount} item={page} disable={page.disable} />
        <div>
          <CountBlock title="Environment" count={envCount} />
          <CountBlock title="Profile" count={profileCount} />
          <CountBlock title="Competitor" count={competitorCount} />
        </div>
        <StyledDesc>{page.url}</StyledDesc>
      </EllipsisText>
      <ButtonOperators
        item={page}
        clickDeleteButton={props.openDeleteModal}
        clickEditButton={props.openEditModal}
        clickDisableButton={props.onClickDisable}
        clickRestoreButton={props.onClickRestore}
        showDisableButton={!page.disable}
        showRestoreButton={page.disable}
      />
    </Stack>
  )
}

const PageHeader: FC<{ item: PageSchema; warning: boolean; disable: boolean }> = ({ item, warning, disable }) => {
  return (
    <h4>
      <span style={disable ? { color: SharedColors.gray10 } : warning ? { color: SharedColors.red10 } : undefined}>
        {item.name}
      </span>
      {warning && (
        <TooltipHost content="This page is unavailable because of missing environment or profile.">
          <Icon styles={{ root: { color: SharedColors.red10, marginLeft: '4px' } }} iconName="warning" />
        </TooltipHost>
      )}
    </h4>
  )
}
