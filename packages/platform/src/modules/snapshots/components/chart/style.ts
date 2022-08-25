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

export const StyledTooltip = styled.div({
  padding: '8px 4px',
  maxWidth: '260px',
  wordBreak: 'break-word',
  whiteSpace: 'pre-wrap',
})

export const StyledItem = styled.div({
  marginTop: '8px',
  display: 'flex',
  b: {
    wordBreak: 'keep-all',
    paddingRight: '4px',
  },
})

export const StyleChartWrapper = styled.div({
  padding: '20px 0',
})

export const TimelineContainer = styled.div(({ theme }) => ({
  width: '100%',
  height: '208px',
  display: 'flex',
  backgroundImage: `linear-gradient(${theme.border.color} 1px,transparent 0)`,
  backgroundSize: '25px 25px',
  backgroundPosition: '0 -1px',
}))

export const TimelineFlamechartContainer = styled.div({
  flex: '1 1 100%',
  overflow: 'hidden',
})

export const TimelineLegendTable = styled.div({
  flex: '0 0 240px',
})

export const TimelineLegendTableRow = styled.div({
  display: 'flex',
  justifyContent: 'space-between',
  height: '25px',
  fontSize: '12px',
  lineHeight: '25px',
  padding: '0 8px',
})

export const TimelineLegendTableHeading = styled(TimelineLegendTableRow)({
  color: NeutralColors.gray110,
})
