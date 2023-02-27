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

import { DefaultButton, Stack, Text } from '@fluentui/react'
import { useCallback } from 'react'

export function NoPermission({ link, type = 'project' }: { link: string; type: 'project' | 'group' }) {
  const onClick = useCallback(() => {
    link && window.open(link, '_blank')
  }, [link])

  return (
    <Stack horizontalAlign="center">
      <Text variant="xLarge">You don't has permission to access this {type}.</Text>
      <Text variant="mediumPlus">Click the button to request permission.</Text>
      <DefaultButton onClick={onClick}>Request</DefaultButton>
    </Stack>
  )
}
