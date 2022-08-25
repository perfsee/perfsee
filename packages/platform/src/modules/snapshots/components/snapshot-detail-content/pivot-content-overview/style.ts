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
import { Stack } from '@fluentui/react'
import { NeutralColors } from '@fluentui/theme'

import { getScoreColor } from '@perfsee/components'
import { darken } from '@perfsee/dls'

export const ScoreContainer = styled(Stack)(({ theme }) => ({
  alignSelf: 'flex-start',
  flex: 1,
  padding: '0 20px',
  minWidth: '200px',
  borderLeft: `1px solid ${theme.border.color}`,
  '> div': {
    width: '100%',
  },
  p: {
    display: 'inline-flex',
    justifyContent: 'space-between',
    paddingBottom: '4px',
    fontSize: '12px',
    color: theme.text.colorSecondary,
    '> b': {
      color: darken(theme.text.colorSecondary, 0.2),
    },
  },
}))

export const ColorScore = styled.b<{ score?: number | null; size?: number }>(({ score, size, theme }) => {
  let color = NeutralColors.black
  if (typeof score === 'number') {
    color = getScoreColor(score * 100)
  }

  return {
    fontSize: size,
    color,
    '> span': {
      fontSize: '18px',
      color: darken(theme.text.colorSecondary, 0.3),
      fontWeight: 400,
    },
  }
})

export const FailedContent = styled.span(({ theme }) => ({
  color: theme.text.colorSecondary,
}))

export const ScoreTitle = styled.b({
  display: 'inline-block',
  margin: '0 5px 0 0',
  fontSize: '32px',
})

export const ScoreDesc = styled.span({
  textOverflow: 'clip',
  fontWeight: 500,
})

export const OverviewZoneContent = styled.div<{ bordered: boolean; padding: boolean }>(
  ({ bordered, padding, theme }) => ({
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    padding: padding ? '12px 16px' : undefined,
    border: bordered ? `1px solid ${theme.border.color}` : undefined,
    borderRadius: '4px',
  }),
)

export const OverviewZoneTitle = styled.div({
  marginBottom: '16px',
  fontSize: '16px',
  fontWeight: '700',
})

export const VideoButton = styled.span(({ theme }) => ({
  color: theme.colors.primary,
  cursor: 'pointer',
  '> span': {
    paddingRight: '4px',
  },
}))

export const VideoTime = styled.div({
  position: 'absolute',
  padding: '4px',
  top: '50%',
  left: '50%',
  borderRadius: '4px',
  transform: 'translate(-50%, -50%)',
  backgroundColor: 'rgba(111,111,111, 0.8)',
  color: 'white',
  textAlign: 'center',
  fontSize: '26px',
})

export const TimelineCell = styled.div({
  display: 'flex',
  flexDirection: 'column',
})

export const TimelineRow = styled.div({
  display: 'flex',
  overflowX: 'auto',
})

export const OverviewScoreWrap = styled.div({
  flexGrow: 1,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  rowGap: '12px',
})

export const RenderTimelineHead = styled.div({
  display: 'flex',

  b: {
    flexGrow: 1,
  },
})
