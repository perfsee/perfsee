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

import { CloseCircleFilled, ExclamationCircleFilled } from '@ant-design/icons'
import styled from '@emotion/styled'
import { IShimmeredDetailsListProps, SharedColors } from '@fluentui/react'
import { Link } from 'react-router-dom'

import { getStringColor } from '@perfsee/components'

export const tableHeaderStyles: IShimmeredDetailsListProps['detailsListStyles'] = {
  headerWrapper: {
    '> div[role="row"]': {
      backgroundColor: '#F2F3F8',
      paddingTop: '0',
      marginTop: '16px',
    },
  },
}

export const InfoRow = styled.div<{ align?: 'center' | 'left' | 'right' }>(({ align }) => ({
  display: 'flex',
  justifyContent: align,
  padding: '0 8px',
}))

export const InfoItem = styled.div<{ minWidth?: number; grow?: number }>(({ minWidth, grow }) => ({
  display: 'inline-block',
  minWidth,
  flexGrow: grow,
  margin: '4px 6px',
}))

export const ProjectAvatar = styled.div(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.colors.running,
  width: '52px',
  height: '52px',
  borderRadius: '50%',
  color: theme.colors.white,
  fontSize: '24px',
  fontWeight: 600,
  textTransform: 'uppercase',
}))

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

export const ProjectSubCountWrap = styled.div({
  display: 'flex',
  alignItems: 'center',
})

export const ProjectSubCountItem = styled.div({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginRight: '100px',
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

export const MoreVersionSpan = styled(Link)({
  fontSize: '12px',
})

export const ChartPartWrap = styled.div({
  marginBottom: '28px',
})

export const ChartPartHeader = styled.div(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: '14px',
  lineHeight: '24px',
  fontWeight: 600,
  color: theme.text.colorInWaringBlock,
}))

export const VersionTag = styled.span(({ theme }) => ({
  display: 'inline-block',
  fontSize: '12px',
  lineHeight: '20px',
  fontWeight: 600,
  color: theme.text.colorInWaringBlock,

  padding: '2px 4px',
  backgroundColor: '#E8F4FF',
  borderRadius: '2px',
  userSelect: 'none',
}))

export const AuditsDetailWrap = styled.div(({ theme }) => ({
  padding: '0 20px',
  borderTop: `1px solid ${theme.border.color}`,
}))

export const AuditsDetailItem = styled.div(({ theme }) => ({
  padding: '12px 0',
  display: 'flex',
  alignItems: 'center',
  borderBottom: `1px solid ${theme.border.color}`,
  fontSize: '12px',
  lineHeight: '20px',
}))

export const AuditsDetailHead = styled(AuditsDetailItem)(({ theme }) => ({
  marginTop: '10px',
  fontSize: '14px',
  lineHeight: '22px',
  fontWeight: 600,
  color: theme.text.colorInWaringBlock,
}))

export const AuditsDetailIconWrap = styled.div({
  fontSize: '14px',
  marginRight: '8px',
})

export const ErrorIcon = styled(CloseCircleFilled)({
  color: SharedColors.red10,
})

export const WarningIcon = styled(ExclamationCircleFilled)({
  color: '#FA9600',
})

export const PanelHeaderWrap = styled.div(({ theme }) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  padding: '13px 20px',

  '& > div:first-of-type': {
    fontSize: '14px',
    lineHeight: '22px',
    fontWeight: 600,
    color: theme.text.colorInWaringBlock,
    marginRight: '8px',
  },
}))

export const ArtifactLabel = styled.span(({ children }) => ({
  display: 'inline-block',
  padding: '1px 5px',
  background: typeof children === 'string' ? getStringColor(children) : SharedColors.blue10,
  borderRadius: '4px',
  color: '#fff',
  marginRight: '8px',
}))
