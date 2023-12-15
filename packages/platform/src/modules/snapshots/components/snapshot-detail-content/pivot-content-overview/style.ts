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
import { DefaultButton, Stack } from '@fluentui/react'
import { CommunicationColors, NeutralColors, SharedColors } from '@fluentui/theme'

export const LHMetricScoreContainer = styled.div(({ theme }) => {
  return {
    display: 'flex',
    width: '100%',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    gap: 24,

    '& > div': {
      flex: '0 0 206px',
      border: `1px solid ${theme.border.color}`,
    },
  }
})

export const ScoreTitle = styled.b({
  display: 'inline-block',
  margin: '0 5px 0 0',
  fontSize: '32px',
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

  '&:hover': {
    filter: 'brightness(1.4)',
  },
}))

export const VideoTime = styled.div({
  userSelect: 'none',
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

export const RenderTimelineHead = styled.div({
  display: 'flex',

  b: {
    flexGrow: 1,
  },
})

export const VideoContainer = styled.div({
  padding: 8,
  borderRadius: '4px',
  border: `1px solid ${NeutralColors.gray50}`,
  position: 'relative',
  height: 'auto',
  maxHeight: '100%',
  width: '100%',
  maxWidth: 'fit-content',

  '& > img': {
    height: '100%',
    width: '100%',
  },

  '& > span': {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
})

export const OverviewMainBlockSeparator = styled.div({
  width: 1,
  height: 120,
  background: NeutralColors.gray50,
  margin: '0 48px',
})

export const LHGauge = styled.svg({
  strokeLinecap: 'round',
})

export const LHGaugeContainer = styled(Stack)({
  position: 'relative',
  '&.fail': {
    color: SharedColors.red10,
    stroke: SharedColors.red10,
    fill: SharedColors.red10,
  },
  '&.average': {
    color: SharedColors.orange20,
    stroke: SharedColors.orange10,
    fill: SharedColors.orange10,
  },
  '&.passed': {
    color: SharedColors.greenCyan10,
    stroke: SharedColors.greenCyan10,
    fill: SharedColors.greenCyan10,
  },
  '&.unavalible': {
    color: NeutralColors.gray110,
    stroke: NeutralColors.gray110,
    fill: NeutralColors.gray110,
  },
})

export const LHGaugeBase = styled.circle({
  opacity: 0.1,
})

export const LHGaugeArc = styled.circle({
  fill: 'none',
  transformOrigin: '50% 50%',
})

export const LHGaugePercentage = styled.div({
  position: 'absolute',
  lineHeight: 0,
  textAlign: 'center',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
})

export const LHGaugeLabel = styled.div({
  fontSize: '1.5rem',
  fontWeight: 500,
})

export const LHGaugeDescription = styled.div({
  maxWidth: '80%',
  color: NeutralColors.gray120,
  fontSize: '0.8rem',
})

export const OverviewMainBlockContainer = styled(Stack)({
  height: 300,
})

export const OverviewMainBlock = styled(Stack)({
  alignItems: 'center',
  justifyContent: 'center',
  margin: '24px 0 16px',
  height: '100%',
  maxWidth: 500,
})

export const LHGaugeScoreScale = styled.div({
  fontSize: 12,
  display: 'flex',
  alignItems: 'center',
  whiteSpace: 'nowrap',
  justifyContent: 'space-around',
  minWidth: '150px',
  verticalAlign: 'center',
  width: '100%',
})

export const LHGaugeScoreScaleFail = styled.span({
  display: 'flex',
  alignItems: 'center',
  '&::before': {
    content: '""',
    width: 12,
    height: 12,
    margin: '0 1px',
    borderLeft: '6px solid transparent',
    borderRight: '6px solid transparent',
    borderBottom: `12px solid ${SharedColors.red10}`,
  },

  span: {
    marginLeft: 14,
  },
})

export const LHGaugeScoreScaleAverage = styled.span({
  display: 'flex',
  alignItems: 'center',
  '&::before': {
    content: '""',
    width: 12,
    height: 12,
    margin: '0 1px',
    background: SharedColors.orange10,
  },
  span: {
    marginLeft: 14,
  },
})

export const LHGaugeScoreScalePassed = styled.span({
  display: 'flex',
  alignItems: 'center',
  '&::before': {
    content: '""',
    width: 14,
    height: 14,
    borderRadius: 14,
    background: SharedColors.greenCyan10,
  },
  span: {
    marginLeft: 14,
  },
})

export const PivotOverviewPartition = styled(Stack)({
  flex: 1,
  minWidth: 670,
  marginRight: 48,

  '& > div': {
    height: '100%',
  },
})

export const PivotReportPartition = styled(Stack)({
  flex: 1,
  maxWidth: 'calc(50% - 24px)',
})

export const OperationButton = styled(DefaultButton)(({ theme }) => ({
  borderColor: theme.text.colorSecondary,
  whiteSpace: 'pre',

  span: {
    color: CommunicationColors.tint10,
  },
}))
