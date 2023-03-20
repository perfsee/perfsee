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

import { DocumentCard } from '@perfsee/components'
import { lighten, SharedColors } from '@perfsee/dls'

export const DataNumber = styled.div(({ theme }) => ({
  fontSize: '2rem',
  fontWeight: 'bold',
  color: theme.text.color,
  position: 'relative',
}))

export const DataUnit = styled.div(({ theme }) => ({
  fontSize: '1rem',
  fontWeight: 'bold',
  color: theme.text.colorSecondary,
}))

export const DataText = styled.div(({ theme }) => ({
  fontSize: '0.8rem',
  color: theme.text.colorSecondary,
}))

export const TransitionNumber = styled(DataNumber)<{ value: string | number }>(({ value, theme }) => ({
  '::before': {
    content: 'attr(data-value)',
    position: 'absolute',
    zIndex: 2,
    overflow: 'hidden',
    color: theme.colors.success,
    whiteSpace: 'nowrap',
    width: '0%',
  },
  ':hover': {
    '::before': {
      width: '100%',
      transition: `width ${value}s linear`,
    },
  },
}))

export const SectionHeading = styled.h2({
  textAlign: 'center',
  position: 'relative',
  // marginTop: 24,
  marginBottom: 12,
  fontSize: '1.5rem',
})

export const Warning = styled.div`
  font-size: 0.8rem;
  background: ${lighten(SharedColors.yellow10, 0.5)};
  padding: 5px 10px;
  border-radius: 4px;
  color: ${SharedColors.orangeYellow10};
  width: max-content;
  margin: auto;

  strong {
    font-size: 0.7rem;
    color: inherit;
    font-weight: 600;
    opacity: 0.8;
    padding-left: 10px;
    text-transform: uppercase;
  }
`
export const DocumentInfoCard = styled(DocumentCard)({
  flex: 1,
  flexShrink: 0,
})

export const TreemapSquare = styled.div`
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  word-break: break-word;
  flex-direction: column;
  position: absolute;

  &:hover {
    //transform:scale(1.05);
    z-index: 1;
    color: rgba(0, 0, 0, 0.8);
    //box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.12);
    filter: brightness(105%);
  }
`

export const TreemapNote = styled.p(({ theme }) => ({
  color: theme.text.colorSecondary,
  margin: '24px 0 0 0',
  lineHeight: 1.2,
}))

export const TreemapContent = styled.div`
  max-height: 100%;
  max-width: 100%;
`

export const TreemapLabel = styled.div`
  max-height: 75%;
  max-width: 100%;
  overflow: hidden;
  a {
    color: inherit;

    &:hover {
      text-decoration: underline;

      &::after {
        position: absolute;
        content: '↗';
      }
    }
  }
`

export const TreemapPercent = styled.div`
  font-size: 2.4rem;
  display: block;
  font-weight: 600;
  letter-spacing: -1px;
  color: rgba(0, 0, 0, 0.5);

  mix-blend-mode: soft-light;
`

export const TreemapSign = styled.span`
  font-size: 50%;
  padding-left: 2px;
`

export const TreemapEllipsis = styled.span`
  font-size: 50%;
  padding-left: 2px;
`
export const TreemapSectionContainer = styled.section(({ theme }) => ({
  display: 'flex',
  height: 'auto',
  flexDirection: 'column',
  borderRadius: theme.border.radius,
  border: `1px solid ${theme.border.color}`,
  padding: '12px 16px',
  width: '100%',
}))

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

export const DataContainer = styled.div(() => {
  return {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  }
})
