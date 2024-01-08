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

import { FilterFilled } from '@ant-design/icons'
import styled from '@emotion/styled'
import { IStackTokens, Pivot, Stack } from '@fluentui/react'

import { NeutralColors } from '@perfsee/dls'

export const cardGap: IStackTokens = { childrenGap: '12px' }

export const BundleCard = styled.div(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.border.radius,
  border: `1px solid ${theme.border.color}`,
  padding: '12px 16px',
  minWidth: '280px',
}))

export const BundleCardTitle = styled.div({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  fontWeight: '600',
  lineHeight: '22px',
  margin: '0 0 8px 0',
  span: {
    marginLeft: '6px',
  },
})

export const BuildRound = styled.span(({ theme }) => ({
  color: theme.text.color,
  lineHeight: '18px',
  marginRight: '8px',
  fontWeight: 'bold',
}))

export const PackageDiffWrap = styled.div(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',

  label: {
    color: theme.text.colorSecondary,
    fontSize: '12px',
  },
  '> span': {
    fontSize: '16px',
  },
  '> div': {
    lineHeight: 1,
    display: 'flex',
  },
}))

export const PackageAdded = styled.span(({ theme }) => ({
  fontSize: '12px',
  color: theme.colors.error,
  marginRight: '12px',
}))

export const PackageRemoved = styled.span(({ theme }) => ({
  fontSize: '12px',
  color: theme.colors.success,
}))

export const JSGroupHeaderWrap = styled.div({
  position: 'relative',
})

export const JSGroupLinkWrap = styled.div({
  display: 'flex',
  alignItems: 'center',
  position: 'absolute',
  right: 24,
  bottom: 15,

  'span + span': {
    marginLeft: '8px',
  },
})

export const EmptyBaselineWrap = styled.div({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: '12px',
  lineHeight: '16px',
  color: NeutralColors.gray50,

  p: {
    marginTop: '0px',
  },
  b: {
    color: NeutralColors.gray100,
  },
})

const BaseIconWrap = styled.div({
  width: '20px',
  height: '20px',
  fontSize: '14px',

  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '3px',
  cursor: 'pointer',

  ':hover': {
    backgroundColor: NeutralColors.gray30,
  },
})

export const EmptyBaselineIcon = styled.span({
  fontSize: '18px',
})

export const TableHeaderFilterWrap = styled.div({
  display: 'flex',
  alignItems: 'center',
})

export const TableHeaderFilterIcon = styled(BaseIconWrap)({
  marginLeft: '4px',
})

export const PackageFilterWrap = styled.div({
  padding: '8px 10px',
})

export const PackageFilterGroupWrap = styled.div({
  margin: '12px 0',
})

export const FilteredIcon = styled(FilterFilled)(({ theme }) => ({
  color: theme.link.color,
}))

export const TraceIconWrap = styled(BaseIconWrap)(({ theme }) => ({
  color: theme.link.color,
}))

export const TableExtraWrap = styled(Stack)({
  padding: '8px 10px 0px 36px',
})

export const StyledPivot = styled(Pivot)(() => {
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  }
})

export const StyledInfoItem = styled.div(({ theme }) => ({
  display: 'flex',
  padding: '8px',
  borderBottom: `1px solid ${theme.border.color}`,
  '> div:first-of-type': {
    width: '300px',
    fontWeight: 'bold',
  },
}))
