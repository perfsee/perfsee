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
import { CommunicationColors, IStackTokens, Pivot, SharedColors, Stack } from '@fluentui/react'

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

export const ArtifactName = styled.span(({ theme }) => ({
  color: theme.text.color,
  lineHeight: '18px',
  marginRight: '8px',
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
  '> div:not(:first-of-type)': {
    width: 150,
  },
}))

export const CodeContainer = styled.div`
  padding: 0 12px;

  pre {
    margin: 0 0 0 3rem;
  }

  pre code {
    text-wrap: wrap;
    word-break: break-all;
    counter-reset: listing;
    display: flex;
    flex-direction: column;
  }

  span.line {
    position: relative;
    counter-increment: listing;
  }

  span.line:empty {
    visibility: hidden;
  }

  span.line:last-child:empty {
    visibility: unset;
    height: 24px;

    &::before {
      visibility: hidden;
    }

    &::after {
      content: '...';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      color: ${NeutralColors.gray90};
    }
  }

  span.line:empty + span.line:not(:empty) {
    margin-top: 24px;

    &::after {
      content: '...';
      position: absolute;
      top: -26px;
      left: 50%;
      transform: translateX(-50%);
      color: ${NeutralColors.gray90};
    }
  }

  span.line::before {
    content: counter(listing) '  ';
    display: inline-block;
    text-align: right;
    color: ${NeutralColors.gray90};
    position: absolute;
    left: -3rem;
    width: 3rem;
  }

  span.highlighted-word {
    background-color: #f6f6f7;
    border: 1px solid #c2c2c4;
    padding: 1px 3px;
    margin: -1px -3px;
    border-radius: 4px;
  }

  span.highlighted-word::after {
    content: attr(data-type);
    color: ${SharedColors.orange20};
    font-size: 12px;
    float: right;
    margin-left: 8px;
    padding: 0 8px;
    line-height: 21px;
    background: ${CommunicationColors.tint40};
  }
`

export const ModulePath = styled.div({
  fontSize: 16,
  padding: '12px 28px',
  fontWeight: 500,
  margin: '12px 0',
  borderBottom: `1px solid ${NeutralColors.gray50}`,
  borderTop: `1px solid ${NeutralColors.gray50}`,
  alignItems: 'center',
  display: 'flex',
  wordBreak: 'break-word',
  gap: 12,

  svg: {
    width: '16px !important',
    height: '16px !important',
  },

  div: {
    display: 'flex',
  },
})

export const MoreResults = styled.div({
  display: 'flex',
  justifyContent: 'center',
  margin: '12px 0',
  color: NeutralColors.gray120,
})
