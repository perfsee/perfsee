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

export const StyledBadge = styled.div<{ color?: string }>(({ color, theme }) => ({
  position: 'relative',
  margin: 0,
  padding: 0,
  display: 'inline-block',
  '> sup': {
    position: 'absolute',
    right: 0,
    top: 0,
    transform: 'translate(50%, -50%)',
    color: theme.colors.white,
    backgroundColor: color ?? theme.colors.error,
  },
}))

export const NumberBadge = styled.sup(() => ({
  minWidth: '20px',
  height: '20px',
  padding: '0 6px',
  fontSize: '12px',
  lineHeight: '20px',
  borderRadius: '10px',
}))

export const DotBadge = styled.sup({
  width: '6px',
  height: '6px',
  borderRadius: '100%',
})
