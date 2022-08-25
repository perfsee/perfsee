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

import { Dialog, DialogFooter, DialogType, DefaultButton, getTheme } from '@fluentui/react'
import { useDispatchers } from '@sigi/react'
import { useCallback } from 'react'

import { ColorButton, useToggleState } from '@perfsee/components'

import { Runner, RunnersModule } from './module'

export function RunnerActivateOperation({ runner }: { runner: Runner }) {
  const theme = getTheme()
  const dispatchers = useDispatchers(RunnersModule)
  const [dialogVisible, showDialog, hideDialog] = useToggleState(false)

  const toggleActivation = useCallback(() => {
    hideDialog()
    dispatchers.updateRunner({ id: runner.id, active: !runner.active })
  }, [runner, hideDialog, dispatchers])

  const text = runner.active ? 'Pause' : 'Resume'
  const color = runner.active ? theme.palette.red : theme.palette.green

  return (
    <>
      <ColorButton color={color} onClick={showDialog}>
        {text}
      </ColorButton>
      <Dialog
        hidden={!dialogVisible}
        onDismiss={hideDialog}
        dialogContentProps={{
          type: DialogType.largeHeader,
          title: 'Confirming',
          // @ts-expect-error this is directly passed as children to a <p></p>
          subText: (
            <>
              Are you sure to <span style={{ color }}>{text.toUpperCase()}</span> the runner with id:{' '}
              <code style={{ wordBreak: 'keep-all' }}>{runner.id}</code>?
            </>
          ),
          styles: { content: { borderColor: color }, title: { color } },
        }}
      >
        <DialogFooter>
          <ColorButton color={color} onClick={toggleActivation}>
            {text}
          </ColorButton>
          <DefaultButton onClick={hideDialog}>cancel</DefaultButton>
        </DialogFooter>
      </Dialog>
    </>
  )
}
