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

export const LegendList = styled.div({
  height: '32px',
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  padding: '0 32px',
  fontWeight: 600,
})

export const UsedLegendIcon = styled.div({
  width: '24px',
  height: '24px',
  margin: '0 16px',
  background: 'rgb(88, 152, 203)',
})

export const UnusedLegendIcon = styled.div({
  width: '24px',
  height: '24px',
  margin: '0 16px',
  background:
    'repeating-linear-gradient( -45deg, hsla(0, 0%, 0%, 0), hsla(0, 0%, 0%, 0) 2px, hsla(7, 85%, 56%, 0.3) 2px, hsla(7, 85%, 56%, 0.3) 4px )',
})

export const ChartContainer = styled.div({
  width: '100%',
  height: 'calc(100vh - 350px)',
})
