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

import { useTheme } from '@emotion/react'
import styled from '@emotion/styled'
import { Stack } from '@fluentui/react'

import { TreeMapTooltipProps } from '@perfsee/components/treemap'
import { ModuleTreeNode } from '@perfsee/shared'

import { ByteSize, NumberDiff } from '../bundle-detail/components'

const Information = styled.div({
  fontSize: '12px',
  lineHeight: 1.4,
  whiteSpace: 'pre',
})

const Modules = styled.ul({
  margin: '4px 8px 0',
  padding: 0,
})

const Name = styled.h3({
  margin: '0',
  fontWeight: 400,
})

export const BundleAnalyzerTooltip: React.FC<TreeMapTooltipProps<ModuleTreeNode>> = ({ data }) => {
  const { name, value, concatenated, modules, gzip, brotli, baseline } = data
  const theme = useTheme()

  const namePart = name ? <Name>{name}</Name> : null

  return (
    <>
      {namePart} {baseline?.name ? `(compare with ${baseline.name})` : ''}
      <Information>
        <Stack horizontal verticalAlign="baseline" tokens={{ childrenGap: 8 }}>
          Raw Size: <ByteSize size={value} />
          {baseline === undefined ? null : baseline ? (
            <NumberDiff current={value} baseline={baseline.size.raw} hideIfNonComparable isBytes />
          ) : (
            <span style={{ color: theme.colors.error }}>new</span>
          )}
        </Stack>
      </Information>
      <Information>
        <Stack horizontal verticalAlign="baseline" tokens={{ childrenGap: 8 }}>
          Gzipped: <ByteSize size={gzip} />
          {baseline ? <NumberDiff current={gzip} baseline={baseline.size.gzip} hideIfNonComparable isBytes /> : null}
        </Stack>
      </Information>
      <Information>
        <Stack horizontal verticalAlign="baseline" tokens={{ childrenGap: 8 }}>
          Brotli: <ByteSize size={brotli} />
          {baseline ? (
            <NumberDiff current={brotli} baseline={baseline.size.brotli} hideIfNonComparable isBytes />
          ) : null}
        </Stack>
      </Information>
      {concatenated && modules?.length && (
        <Modules>
          {modules.map((path, i) => (
            <Information key={i}>{path}</Information>
          ))}
        </Modules>
      )}
    </>
  )
}
