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

export const ProgressContainer = styled.div<{ backgroundColor?: string; width?: string; height?: string }>(
  ({ backgroundColor, width, height, theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: width ?? '100%',
    height: height ?? '4px',
    backgroundColor: backgroundColor ?? theme.colors.secondary,
    overflow: 'hidden',
    borderRadius: '2px',
  }),
)

export const ProgressInner = styled.div<{ percent: number; color: string }>(({ percent, color }) => ({
  width: `${percent * 100}%`,
  height: '100%',
  backgroundColor: color,
}))

export const Level = styled.div<{ color: string }>(({ color }) => ({
  backgroundColor: color,
  height: '100%',
}))
