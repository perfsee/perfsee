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

export const Container = styled.div({
  padding: '0 80px',
  minHeight: 'calc(100vh - 120px)',
  display: 'flex',
  flexDirection: 'column',
})

export const Wrap = styled.div({
  display: 'flex',
  flexGrow: 1,
  flexShrink: 1,
  marginTop: '12px',
})

export const ListWrap = styled.div({
  flex: '0 0 250px',
  border: '1px solid #eee',
})

export const AppWrap = styled.div({
  borderBottom: '1px solid #eee',
  padding: '6px 8px',
  cursor: 'pointer',
})

export const AppName = styled.p({
  fontSize: '16px',
  fontWeight: 600,
})

export const AppDetailWrap = styled.div({
  flexGrow: 1,
  flexShrink: 1,
  padding: '12px 24px',
})

export const ProjectsContainer = styled.div({
  display: 'flex',
  flexWrap: 'wrap',
  padding: '12px 0',
  marginBottom: '12px',
})

export const ProjectItemWrap = styled.div(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  border: `1px solid ${theme.border.color}`,
  borderRadius: '14px',
}))

export const ProjectItemName = styled.span(({ theme }) => ({
  fontSize: '14px',
  borderRight: `1px solid ${theme.border.color}`,
  padding: '2px 8px',
}))

export const ProjectItemPermission = styled.span({
  fontSize: '12px',
  padding: '0px 8px',
})
