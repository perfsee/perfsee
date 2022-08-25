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

export const AppError = styled.div(({ theme }) => ({
  position: 'absolute',
  top: 0,
  bottom: 0,
  width: '100%',
  backgroundColor: theme.colors.appCrashedBackground,
  padding: '120px',
}))

export const Face = styled.h1(({ theme }) => ({
  fontSize: '120px',
  color: theme.text.appCrashedColor,
  fontWeight: 'lighter',
  fontFamily: 'sans-serif',
}))

export const AppErrorTitle = styled.h1(({ theme }) => ({
  color: theme.text.appCrashedColor,
  fontWeight: 'normal',
}))
