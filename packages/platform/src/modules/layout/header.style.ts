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

import { darken, NeutralColors } from '@perfsee/dls'

export const HeaderContainer = styled.div(({ theme }) => ({
  position: 'sticky',
  top: 0,
  display: 'flex',
  width: '100%',
  height: '60px',
  padding: `5px ${theme.layout.mainPadding}`,
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: theme.colors.white,
  zIndex: 3,
}))

export const HeaderMenusContainer = styled.div({
  display: 'flex',
  alignItems: 'center',
})

export const Title = styled.h1(({ theme }) => ({
  color: theme.text.color,
  marginLeft: '15px',
  cursor: 'pointer',
}))

export const HeaderTitleContainer = styled.div({
  display: 'flex',
  alignItems: 'center',

  '@media screen and (max-width: 992px)': {
    flexDirection: 'column',
    marginLeft: '10px',
    alignItems: 'flex-start',
    flexShrink: 0,

    [`${Title}`]: {
      fontSize: '16px',
      marginLeft: 0,
    },
  },
})

export const HeaderOperatorContainer = styled.div(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  '> *': {
    padding: '0 10px',
    cursor: 'pointer',
    color: theme.text.color,
    textDecoration: 'none',
    ':visited': {
      color: theme.text.color,
    },
    ':hover': {
      color: theme.colors.primary,
    },
  },
  '> :not(:last-child)': {
    borderRight: `1px solid ${darken(theme.border.color, 0.1)}`,
  },
}))

export const HoverCardWrap = styled.div(({ theme }) => ({
  padding: '4px 0 0',
  width: '150px',

  // for overriding a:-webkit-any-link
  '& > div, div& > a': {
    height: '36px',
    padding: '0 12px',
    display: 'flex',
    alignItems: 'center',
    color: theme.text.color,
    textDecoration: 'none',
    cursor: 'pointer',

    ':hover': {
      color: theme.text.color,
      textDecoration: 'none',
      backgroundColor: NeutralColors.gray20,
    },
  },
}))

export const HeaderOperatorSmallWrap = styled.div({
  display: 'none',
})

export const HeaderOperatorWrap = styled.div({
  '@media screen and (max-width: 992px)': {
    [`${HeaderOperatorContainer}`]: {
      display: 'none',
    },
    [`${HeaderOperatorSmallWrap}`]: {
      display: 'block',
    },
  },
})

export const Logo = styled.img({
  ':hover': {
    cursor: 'pointer',
  },
})

export const UserInfoCalloutContainer = styled.div({
  padding: '16px',
  minWidth: '300px',
})
