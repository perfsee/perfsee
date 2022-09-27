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
import { NavLink } from 'react-router-dom'

import { resetLink } from '@perfsee/dls'

export const Title = styled.h1(({ theme }) => ({
  fontWeight: '600',
  fontSize: '20px',
  margin: '24px 0 16px',
  padding: '0 0 8px',
  borderBottom: '1px solid ' + theme.border.color,
  ':first-child': {
    marginTop: '0px',
  },
}))

export const Hr = styled.div(({ theme }) => ({
  borderTop: '1px solid ' + theme.border.color,
}))

export const NavbarContainer = styled(Stack)({
  width: '230px',
  margin: '32px 0 0',
})

export const NavbarItem = styled(NavLink)({
  width: '100%',
  padding: '8px 16px',
  color: '#000',
  ':hover': {
    background: '#eee',
    textDecoration: 'none',
  },
  ...resetLink('#000'),
})

export const PageLayout = styled(Stack)({
  flexDirection: 'row',
  '@media screen and (max-width: 992px)': {
    flexDirection: 'column',
  },
})
