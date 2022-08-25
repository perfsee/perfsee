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

import { NeutralColors } from '@perfsee/dls'

export const CalloutWrapper = styled.div({
  display: 'inline-block',
})

export const CalloutLabel = styled.h4({
  display: 'inline',
  color: NeutralColors.gray100,
  paddingLeft: 10,
})

export const SelectorTitle = styled.h3<{ isFirst?: boolean }>(({ isFirst }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: `0 10px 0 ${isFirst ? 0 : '10px'}`,
  cursor: 'pointer',
  wordSpacing: '-5px',
  span: {
    display: 'inline-flex',
    maxWidth: '400px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}))
