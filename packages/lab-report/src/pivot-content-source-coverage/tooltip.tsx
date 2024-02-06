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

import styled from '@emotion/styled'
import { SharedColors } from '@fluentui/theme'

import { TreeMapTooltipProps } from '@perfsee/components/treemap'
import { PrettyBytes } from '@perfsee/shared'

const Information = styled.div({
  fontSize: '12px',
  lineHeight: 1.4,
  whiteSpace: 'nowrap',
})

const Name = styled.h3({
  margin: '0',
  fontWeight: 400,
})

const Warning = styled.span({
  color: SharedColors.red10,
})

export const SourceCoverageTooltip: React.FC<TreeMapTooltipProps<LH.Treemap.Node>> = ({ data }) => {
  const { name, resourceBytes, unusedBytes } = data

  const namePart = name ? <Name>{name}</Name> : null

  return (
    <>
      {namePart}
      <Information>Raw Size: {PrettyBytes.create(resourceBytes).toString()}</Information>
      {unusedBytes && (
        <>
          <Information>
            Used Size: {PrettyBytes.create(resourceBytes - unusedBytes).toString()}
            {` (${((1 - unusedBytes / resourceBytes) * 100).toFixed(2)}%)`}
          </Information>
          <Information>
            Unused Size: {PrettyBytes.create(unusedBytes).toString()}
            <Warning>{` (${((unusedBytes / resourceBytes) * 100).toFixed(2)}%)`}</Warning>
          </Information>
        </>
      )}
    </>
  )
}
