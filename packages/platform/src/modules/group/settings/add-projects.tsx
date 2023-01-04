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

import { Persona, PersonaInitialsColor, PersonaSize, PrimaryButton, SelectionMode, Stack } from '@fluentui/react'
import { useCallback, useMemo, useState } from 'react'

import { Modal, PopConfirm, Table, TableColumnProps, useToggleState } from '@perfsee/components'

import { ProjectInGroup } from '../../shared'
import { SearchProjectsSelect } from '../components'
import { OperationSpan } from '../styled'

type Props = {
  projects: ProjectInGroup[]
  onAddProject: (projectId: string) => void
  onDeleteProject: (projectId: string) => void
}

export function AddProjects({ projects, onAddProject, onDeleteProject }: Props) {
  const [selected, setProject] = useState<string>()
  const [dialogVisible, showModal, hideModal] = useToggleState()

  const onDelete = useCallback(
    (projectId: string) => () => {
      onDeleteProject(projectId)
    },
    [onDeleteProject],
  )

  const columns = useMemo<TableColumnProps<ProjectInGroup>[]>(
    () => [
      {
        key: 'avatar',
        name: '',
        minWidth: 24,
        maxWidth: 24,

        onRender: (item) => (
          <Persona initialsColor={PersonaInitialsColor.blue} size={PersonaSize.size24} text={item.name} />
        ),
      },
      {
        key: 'id',
        name: 'ID',
        minWidth: 200,
        maxWidth: 200,
        onRender: (item) => item.id,
      },
      {
        key: 'namespace',
        name: 'Namespace',
        minWidth: 150,
        maxWidth: 150,
        onRender: (item) => item.namespace,
      },
      {
        key: 'name',
        name: 'Name',
        minWidth: 150,
        maxWidth: 150,
        onRender: (item) => item.name,
      },
      {
        key: 'operation',
        name: 'Operations',
        minWidth: 200,
        onRender: (item) => {
          return (
            <Stack horizontal>
              <PopConfirm title="Confirm remove this project?" onConfirm={onDelete(item.id)}>
                <OperationSpan>remove</OperationSpan>
              </PopConfirm>
            </Stack>
          )
        },
      },
    ],
    [onDelete],
  )

  const onModalConfirm = useCallback(() => {
    selected && onAddProject(selected)
    setProject(undefined)
    hideModal()
  }, [hideModal, onAddProject, selected])

  return (
    <div>
      <PrimaryButton iconProps={{ iconName: 'plus' }} onClick={showModal}>
        Add Project
      </PrimaryButton>
      <Table columns={columns} items={projects} selectionMode={SelectionMode.none} />
      <Modal
        styles={{ main: { width: '500px' } }}
        title="Add Project"
        onConfirm={onModalConfirm}
        confirmDisabled={!selected}
        isOpen={dialogVisible}
        onClose={hideModal}
      >
        <Stack tokens={{ padding: '10px 20px' }}>
          <SearchProjectsSelect
            placeholder="Search Project"
            multiSelect={false}
            selectedProject={selected}
            onSelect={setProject}
          />
        </Stack>
      </Modal>
    </div>
  )
}
