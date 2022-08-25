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
import { Link } from 'react-router-dom'

export const StyledLink = styled(Link)({
  fontSize: '12px',
})

export const LatestVersionInfo = styled.div({
  display: 'flex',
  alignItems: 'center',
})

export const InfoDivider = styled.div(({ theme }) => ({
  height: '12px',
  width: '1px',
  backgroundColor: theme.border.color,
  margin: '0 12px',
}))

export const InfoKeySpan = styled.span(({ theme }) => ({
  fontSize: '12px',
  lineHeight: '20px',
  color: theme.text.colorSecondary,
  marginRight: '8px',
}))

export const InfoValueSpan = styled(InfoKeySpan)(({ theme }) => ({
  color: theme.text.color,
}))

export const VersionTag = styled.span(({ theme }) => ({
  display: 'inline-blocl',
  fontSize: '12px',
  lineHeight: '20px',
  fontWeight: 600,
  color: theme.text.colorInWaringBlock,

  padding: '2px 4px',
  backgroundColor: '#E8F4FF',
  borderRadius: '2px',
  userSelect: 'none',
}))

export const VersionDetailItem = styled.div({
  marginTop: '20px',
})

export const VersionDetailItemHeader = styled.div(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  fontSize: '14px',
  lineHeight: '22px',
  fontWeight: 600,
  color: theme.text.color,

  '&::before': {
    content: '" "',
    display: 'inline-block',
    width: '3px',
    height: '12px',
    backgroundColor: theme.colors.running,
    marginRight: '8px',
  },

  '> span': {
    marginRight: '8px',
  },
}))

export const ScoreWrap = styled.div({
  display: 'flex',
  marginTop: '8px',
})

export const PerformanceScoreWrap = styled.div<{ color: string }>(({ color }) => ({
  width: '160px',
  borderRadius: '4px',
  backgroundColor: color,
  overflow: 'hidden',
}))

export const PerformanceScoreHeader = styled.div<{ color: string }>(({ color, theme }) => ({
  backgroundColor: color,
  fontSize: '14px',
  lineHeight: '22px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.colors.white,
}))

export const PerformanceScoreContent = styled.div<{ color: string }>(({ color }) => ({
  color,
  fontSize: '28px',
  height: '54px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}))

export const FlexCenterWrap = styled.div({
  display: 'flex',
  alignItems: 'center',
})

export const ScoreDisplayItem = styled.div({
  width: '180px',
  padding: '16px 22px',
  display: 'flex',
  flexDirection: 'column',
  a: {
    lineHeight: '30px',
  },
})

export const ProjectSubCountName = styled.span(({ theme }) => ({
  fontSize: '12px',
  lineHeight: '20px',
  color: theme.text.color,
}))

export const ProjectSubCountNum = styled.span<{ color?: string }>(({ color, theme }) => ({
  fontSize: '24px',
  lineHeight: '36px',
  fontWeight: 600,
  color: color ?? theme.text.color,
}))

export const SizeWrap = styled.div(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-end',

  fontSize: '24px',
  color: theme.text.color,
}))

export const SizeUnit = styled.span(({ theme }) => ({
  fontSize: '12px',
  color: theme.text.colorSecondary,
  lineHeight: '24px',
  marginLeft: '8px',
}))

export const PerformanceRadarWrap = styled.div({
  flex: '0 0 460px',
  height: '100%',
  display: 'flex',
  alignSelf: 'center',

  '& > div': {
    width: '100%',
  },
})

export const ScoreWarningWrap = styled.div({
  marginLeft: '12px',
})

export const ScoreWarningItem = styled.div(({ theme }) => ({
  display: 'flex',
  color: SharedColors.red10,
  alignItems: 'center',
  fontSize: '12px',

  '::before': {
    width: '4px',
    height: '4px',
    backgroundColor: theme.colors.primaryBackground,
    borderRadius: '4px',
    marginRight: '8px',
    content: "' '",
  },
}))

export const ScoreWarningLink = styled(Link)({
  fontSize: '12px',
  marginLeft: '8px',
})
