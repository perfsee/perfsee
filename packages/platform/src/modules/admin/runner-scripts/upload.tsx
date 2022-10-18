import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  getTheme,
  PrimaryButton,
  Stack,
  TextField,
  Label,
  Checkbox,
} from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useCallback, useState } from 'react'

import { ColorButton, Form, RequiredTextField, useToggleState } from '@perfsee/components'

import { JobTypeSelector } from '../runners/job-type-selector'

import { RunnerScriptModule } from './module'

export const UploadButton = () => {
  const theme = getTheme()
  const [dialogVisible, showDialog, hideDialog] = useToggleState(false)

  return (
    <div>
      <ColorButton color={theme.palette.blue} onClick={showDialog}>
        Upload
      </ColorButton>
      <Dialog
        minWidth="600px"
        hidden={!dialogVisible}
        onDismiss={hideDialog}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Upload a new version',
        }}
      >
        <UploadForm onClose={hideDialog} />
      </Dialog>
    </div>
  )
}

const UploadForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [state, dispatcher] = useModule(RunnerScriptModule)
  const [jobType, setJobType] = useState(state.jobType)
  const [version, setVersion] = useState<string | undefined>()
  const [checksum, setChecksum] = useState<string | undefined>()
  const [description, setDescription] = useState<string | undefined>()
  const [file, setFile] = useState<File | undefined>()
  const [enable, setEnable] = useState<boolean>(true)

  const onVersionChange = useCallback((_e: any, value?: string) => {
    setVersion(value)
  }, [])

  const onChecksumChange = useCallback((_e: any, value?: string) => {
    setChecksum(value)
  }, [])

  const onDescriptionChange = useCallback((_e: any, value?: string) => {
    setDescription(value)
  }, [])

  const onEnableChange = useCallback((_e: any, value?: boolean) => {
    setEnable(value ?? true)
  }, [])

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0])
  }, [])

  const submitDisabled = !version || !file || state.uploading

  const onSubmit = useCallback(() => {
    if (!file || !version || !checksum) return
    dispatcher.upload({
      file,
      jobType,
      version,
      enable,
      description,
      checksum,
    })
    onClose()
  }, [description, dispatcher, enable, file, jobType, onClose, version, checksum])

  return (
    <Form loading={state.uploading}>
      <JobTypeSelector jobType={jobType} label="Job Type" onChange={setJobType} />
      <RequiredTextField onChange={onVersionChange} label="Version" />
      <RequiredTextField onChange={onChecksumChange} label="checksum" />
      <TextField onChange={onDescriptionChange} label="Description" />
      <Label>File</Label>
      <input type="file" onChange={onFileChange} />
      <Checkbox
        styles={{
          root: {
            margin: '8px 0',
          },
        }}
        onChange={onEnableChange}
        label="Enable after creation"
        checked={enable}
      />
      <Stack.Item>
        <DialogFooter>
          <PrimaryButton text="OK" disabled={submitDisabled} onClick={onSubmit} />
          <DefaultButton onClick={onClose} text="Cancel" />
        </DialogFooter>
      </Stack.Item>
    </Form>
  )
}
