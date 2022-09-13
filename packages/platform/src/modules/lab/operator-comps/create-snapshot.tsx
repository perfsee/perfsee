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

import { PrimaryButton, Stack, Dialog, IconButton } from '@fluentui/react'
import { useDispatchers } from '@sigi/react'
import { useState, useCallback, useMemo, useEffect } from 'react'

import { Permission } from '@perfsee/schema'

import { PropertyModule, useProject } from '../../shared'

import { ExistedPages } from './existed-pages'
import { EntryButton, StyledHeader } from './style'
import { TempPages } from './temp-pages'

const modelProps = {
  isBlocking: true,
}

const iconProps = {
  iconName: 'ChevronLeft',
}

enum ContentType {
  HomePage = 0,
  TempPage,
  ExistedPage,
}

export const CreateSnapshot = () => {
  const dispatcher = useDispatchers(PropertyModule)
  const project = useProject()

  const [visible, setVisible] = useState<boolean>(false)
  const [contentNumber, setContentNumber] = useState<ContentType>(ContentType.HomePage)

  useEffect(() => {
    if (visible) {
      dispatcher.fetchProperty()
    }
  }, [dispatcher, visible])

  const toggleOpenDialog = useCallback(() => {
    setVisible((v) => !v)
  }, [])

  const onSetContentNumber = useCallback((num: ContentType) => {
    return () => setContentNumber(num)
  }, [])

  const content = useMemo(() => {
    if (contentNumber === ContentType.ExistedPage) {
      return <ExistedPages onCloseModal={toggleOpenDialog} />
    }
    if (contentNumber === ContentType.TempPage) {
      return <TempPages onCloseModal={toggleOpenDialog} />
    }
    return (
      <Stack>
        <EntryButton onClick={onSetContentNumber(ContentType.ExistedPage)}>Select existed pages</EntryButton>
        <EntryButton onClick={onSetContentNumber(ContentType.TempPage)}>Add temporary page</EntryButton>
      </Stack>
    )
  }, [contentNumber, onSetContentNumber, toggleOpenDialog])

  const header = useMemo(() => {
    const backButton = contentNumber ? <IconButton iconProps={iconProps} onClick={onSetContentNumber(0)} /> : null
    return (
      <StyledHeader tokens={{ childrenGap: 4 }} horizontal verticalAlign="center">
        {backButton}
        <h2>Take a snapshot</h2>
      </StyledHeader>
    )
  }, [contentNumber, onSetContentNumber])

  // only allow admin permission users to take snapshot manually
  if (!project || !project.userPermission.includes(Permission.Admin)) {
    return null
  }

  return (
    <Stack horizontal horizontalAlign="end">
      <PrimaryButton onClick={toggleOpenDialog}>Take a snapshot</PrimaryButton>
      <Dialog
        minWidth="700px"
        modelProps={modelProps}
        onDismiss={toggleOpenDialog}
        styles={{ main: { '.ms-Dialog-header': { display: 'none' } } }}
        hidden={!visible}
      >
        {header}
        {content}
      </Dialog>
    </Stack>
  )
}
