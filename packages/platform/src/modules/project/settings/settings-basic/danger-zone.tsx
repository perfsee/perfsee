import { getTheme, SharedColors, Spinner, SpinnerSize, TextField } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useCallback, useState } from 'react'
import { Redirect } from 'react-router-dom'

import { ColorButton, Modal, ModalType, useToggleState } from '@perfsee/components'
import { DeleteProgress, ProjectModule, useSettings } from '@perfsee/platform/modules/shared'
import { pathFactory } from '@perfsee/shared/routes'

import {
  ButtonInnerText,
  DangerContent,
  DangerDescription,
  DangerItem,
  DangerTitle,
  PublicConfirmWrap,
  PublicModalContent,
} from './style'

const DeleteProject = () => {
  const theme = getTheme()
  const [text, setText] = useState<string>()
  const [{ project, deleteProgress }, dispatcher] = useModule(ProjectModule)

  const [dialogVisible, showDialog, hideDialog] = useToggleState()

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

  if (!project) {
    return null
  }

  const color = theme.palette.red

  return (
    <DangerItem>
      <DangerContent>
        <DangerDescription>
          <p>Delete this project</p>
          <span>All data will be deleted and can not be restored</span>
        </DangerDescription>

        <ColorButton color={SharedColors.red10} onClick={showDialog}>
          <ButtonInnerText>Delete</ButtonInnerText>
        </ColorButton>
      </DangerContent>
      <Modal
        isOpen={dialogVisible}
        title="Delete Project"
        type={ModalType.Warning}
        confirmDisabled={text !== project.id}
        onClose={onDismiss}
        onConfirm={deleteProject}
      >
        {deleteProgress === DeleteProgress.Running ? (
          <Spinner styles={{ root: { margin: '18px 0' } }} label="Deleting..." size={SpinnerSize.large} />
        ) : (
          <PublicModalContent>
            <p>All history data will be destroyed forever, immediately!</p>
            <p>
              To confirm, type <span style={{ color }}>{project?.id}</span>
            </p>
            <TextField styles={{ root: { marginTop: '4px' } }} onChange={onChange} />
          </PublicModalContent>
        )}
      </Modal>
    </DangerItem>
  )
}

const ProjectVisibility = () => {
  const [{ project }, { updateProject }] = useModule(ProjectModule)

  const [modalVisible, showModal, hideModal] = useToggleState(false)
  const [validateSlug, setValidateSlug] = useState('')

  const onChangeValidateSlug = useCallback((_: any, newValue?: string) => {
    setValidateSlug(newValue ?? '')
  }, [])

  const onConfirmChange = useCallback(() => {
    if (!project || validateSlug !== project.id) {
      return
    }

    updateProject({ projectId: project.id, input: { isPublic: !project.isPublic } })
    hideModal()
    setValidateSlug('')
  }, [hideModal, project, updateProject, validateSlug])

  if (!project) {
    return null
  }

  const { isPublic, id } = project

  return (
    <DangerItem>
      <DangerContent>
        <DangerDescription>
          <p>This project is now {isPublic ? 'public' : 'private'}</p>
          <span>{isPublic ? 'Everyone could visit' : 'Only authorized user could visit'}</span>
        </DangerDescription>
        <ColorButton color={SharedColors.red10} onClick={showModal}>
          <ButtonInnerText>Make it {isPublic ? 'private' : 'public'}</ButtonInnerText>
        </ColorButton>
      </DangerContent>
      <Modal
        isOpen={modalVisible}
        title={`Make project ${isPublic ? 'private' : 'public'}`}
        type={ModalType.Warning}
        confirmDisabled={validateSlug !== id}
        onClose={hideModal}
        onConfirm={onConfirmChange}
      >
        <PublicModalContent>
          {isPublic ? (
            <p>Hide project for no permission users.</p>
          ) : (
            <p>
              This operation will make this project visible to <b>anyone</b>.
            </p>
          )}
          <PublicConfirmWrap>
            <p>
              Please type the entire project id <b>{id}</b> to confirm.
            </p>
            <TextField styles={{ root: { marginTop: '8px' } }} onChange={onChangeValidateSlug} />
          </PublicConfirmWrap>
        </PublicModalContent>
      </Modal>
    </DangerItem>
  )
}

export const DangerZone = () => {
  const settings = useSettings()

  return (
    <div>
      <DangerTitle>Danger Zone</DangerTitle>
      <ProjectVisibility />
      {settings.enableProjectDelete && <DeleteProject />}
    </div>
  )
}
