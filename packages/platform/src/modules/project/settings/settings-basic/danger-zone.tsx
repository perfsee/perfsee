import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  getTheme,
  SharedColors,
  Spinner,
  SpinnerSize,
  TextField,
} from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useCallback, useState } from 'react'
import { Redirect } from 'react-router-dom'

import { ColorButton, useToggleState } from '@perfsee/components'
import { DeleteProgress, ProjectModule } from '@perfsee/platform/modules/shared'
import { pathFactory } from '@perfsee/shared/routes'

export const DangerZone = () => {
  const theme = getTheme()
  const [dialogVisible, showDialog, hideDialog] = useToggleState()
  const [text, setText] = useState<string>()
  const [{ project, deleteProgress }, dispatcher] = useModule(ProjectModule)

  const deleteProject = useCallback(() => {
    if (project && text === project.id) {
      dispatcher.deleteProject(project.id)
    }
  }, [dispatcher, project, text])

  const onChange = useCallback((_e: any, newValue?: string) => {
    setText(newValue)
  }, [])

  const onDismiss = useCallback(() => {
    if (deleteProgress !== DeleteProgress.Running) {
      hideDialog()
    }
  }, [deleteProgress, hideDialog])

  if (deleteProgress === DeleteProgress.Done) {
    return <Redirect to={pathFactory.home()} push={false} />
  }

  const color = theme.palette.red

  return (
    <>
      <div>
        <h4 style={{ marginBottom: '4px' }}>Danger Zone</h4>
        <ColorButton styles={{ root: { width: '100px' } }} color={SharedColors.red10} onClick={showDialog}>
          Delete
        </ColorButton>
      </div>
      <Dialog
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Delete Project',
        }}
        hidden={!dialogVisible}
        onDismiss={onDismiss}
      >
        {deleteProgress === DeleteProgress.Running ? (
          <Spinner label="Deleting..." size={SpinnerSize.large} />
        ) : (
          <>
            <p>
              All history data will be destroyed forever, immediately! To confirm, type{' '}
              <span style={{ color }}>{project?.id}</span>
            </p>
            <TextField styles={{ root: { marginTop: '4px' } }} onChange={onChange} />
            <DialogFooter>
              <ColorButton color={SharedColors.red10} onClick={deleteProject} text="Confirm" />
              <DefaultButton onClick={hideDialog} text="Cancel" />
            </DialogFooter>
          </>
        )}
      </Dialog>
    </>
  )
}
