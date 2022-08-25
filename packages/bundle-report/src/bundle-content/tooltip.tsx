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

import { TreeMapTooltipProps } from '@perfsee/components/treemap'
import { PrettyBytes, ModuleTreeNode } from '@perfsee/shared'

const Information = styled.div({
  fontSize: '12px',
  lineHeight: 1.4,
  whiteSpace: 'nowrap',
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
  const { name, value, concatenated, modules, gzip, brotli } = data

  const namePart = name ? <Name>{name}</Name> : null

  return (
    <>
      {namePart}
      <Information>Raw Size: {PrettyBytes.create(value).toString()}</Information>
      <Information>Gzipped Size: {PrettyBytes.create(gzip).toString()}</Information>
      <Information>Brotlied Size: {PrettyBytes.create(brotli).toString()}</Information>
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
