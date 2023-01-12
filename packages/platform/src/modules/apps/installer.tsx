import {
  Stack,
  Text,
  SelectionMode,
  Persona,
  Spinner,
  SpinnerSize,
  SharedColors,
  PrimaryButton,
  ChoiceGroup,
  IChoiceGroupOption,
  IconButton,
} from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router'

import { BodyContainer, Pagination, useQueryString, Table } from '@perfsee/components'
import { Permission } from '@perfsee/schema'
import { pathFactory, RouteTypes } from '@perfsee/shared/routes'

import { ProjectNode, ProjectsModule } from '../project/list.module'
import { ProjectModule } from '../shared'

import { ApplicationInstallerModule } from './installer.module'
import { CardContainer, CenterText, ProjectSearchBar, SelectorContainer, Title } from './style'

const Authorization = ({ projectId, appId }: { projectId: string; appId: number }) => {
  const [{ project, loading }, dispatcher] = useModule(ProjectModule)
  const [{ returnUrl, action }, updateQueryString] = useQueryString<{ action: string; returnUrl: string }>()

  const [{ installSuccess, installing }, installerDispatcher] = useModule(ApplicationInstallerModule)

  useEffect(() => {
    dispatcher.getProject({ projectId })
    return dispatcher.reset
  }, [dispatcher, projectId])

  const handleChangeAction = useCallback(
    (_e: any, option?: IChoiceGroupOption) => {
      updateQueryString({ action: option?.key })
    },
    [updateQueryString],
  )

  const handleClickInstall = useCallback(() => {
    installerDispatcher.authNewApplications({
      projectId,
      applicationId: appId,
      permissions: action === 'Admin' ? [Permission.Admin, Permission.Read] : [Permission.Read],
    })
  }, [action, appId, installerDispatcher, projectId])

  useEffect(() => {
    if (installSuccess) {
      const timeout = setTimeout(() => {
        location.href = returnUrl || pathFactory.project.settings({ projectId, settingName: 'basic' })
      }, 3000)

      return () => {
        clearTimeout(timeout)
      }
    }
  }, [installSuccess, projectId, returnUrl])

  const hasPermission = !!project?.userPermission.includes(Permission.Admin)

  if (loading) {
    return <Spinner size={SpinnerSize.large} />
  }

  if (!hasPermission) {
    return (
      <Stack tokens={{ childrenGap: 32 }}>
        <CenterText>
          <>You don't has admin permission for the project '{projectId}'</>
        </CenterText>
        <PrimaryButton disabled>Install</PrimaryButton>
      </Stack>
    )
  }

  return (
    <Stack tokens={{ childrenGap: 32 }}>
      <Stack horizontal>
        <ChoiceGroup
          options={[
            { key: 'Admin', text: 'Admin', iconProps: { iconName: 'fileProtect' } },
            { key: 'Read', text: 'Read', iconProps: { iconName: 'fileSearch' } },
          ]}
          defaultSelectedKey={action}
          onChange={handleChangeAction}
        />
      </Stack>
      {installSuccess ? (
        <PrimaryButton disabled>redirecting...</PrimaryButton>
      ) : (
        <PrimaryButton onClick={handleClickInstall} disabled={(action !== 'Admin' && action !== 'Read') || installing}>
          {installing ? <Spinner size={SpinnerSize.small} /> : 'Install'}
        </PrimaryButton>
      )}
    </Stack>
  )
}

const renderProjectItem = (project?: ProjectNode, _index?: number) => {
  if (!project) {
    return null
  }

  return (
    <Stack verticalAlign="center" horizontal={true} tokens={{ childrenGap: 8 }}>
      {project.id}
      <Text variant="small">
        {project.namespace}/{project.name}
      </Text>
    </Stack>
  )
}

const ProjectSelector = ({ onSelect }: { onSelect: (projectId: string) => void }) => {
  const [{ projects, loading, totalCount }, dispatcher] = useModule(ProjectsModule)

  const [{ page, pageSize, query }, setProjectQuery] = useState<{
    page: number
    pageSize: number
    query: string
  }>({ page: 1, pageSize: 5, query: '' })

  useEffect(() => {
    dispatcher.getProjects({
      page: page,
      pageSize: pageSize,
      query,
      permission: Permission.Admin,
      starred: false,
    })
  }, [dispatcher, page, pageSize, query])

  useEffect(() => dispatcher.reset, [dispatcher])

  const handlePageChange = useCallback((page: number, pageSize: number) => {
    setProjectQuery((prev) => ({ page, pageSize, query: prev.query }))
  }, [])

  const handleRowClick = useCallback(
    (project: ProjectNode | null) => {
      if (project) {
        onSelect(project.id)
      }
    },
    [onSelect],
  )

  const handleSearchChange = useCallback((_e: any, query: string | undefined) => {
    setProjectQuery((prev) => ({ ...prev, query: query || '' }))
  }, [])

  return (
    <>
      <SelectorContainer>
        <ProjectSearchBar placeholder="Search projects" defaultValue={query} onChange={handleSearchChange} />
        <Table
          selectionMode={SelectionMode.none}
          items={projects}
          columns={[
            {
              key: 'project',
              name: 'Project',
              minWidth: 100,
              flexGrow: 1,
              onRender: (project) => (
                <Stack tokens={{ childrenGap: 4 }}>
                  <Text>{project.id}</Text>
                  <Text variant="small" styles={{ root: { color: SharedColors.gray30 } }}>
                    {project.namespace}/{project.name}
                  </Text>
                </Stack>
              ),
            },
          ]}
          isHeaderVisible={false}
          enableShimmer={loading}
          shimmerLines={6}
          onRowClick={handleRowClick}
          onRenderCell={renderProjectItem}
        />
      </SelectorContainer>
      <Pagination
        total={totalCount}
        onChange={handlePageChange}
        page={page}
        pageSize={pageSize}
        hideOnSinglePage={true}
      />
    </>
  )
}

export const AppInstaller = () => {
  const { appName } = useParams<RouteTypes['app']['install']>()

  const [{ projectId }, updateQueryString] = useQueryString<{ projectId: string }>()

  const [{ application, loading }, dispatcher] = useModule(ApplicationInstallerModule)

  useEffect(() => {
    dispatcher.getApplication({ appName })
    return dispatcher.reset
  }, [appName, dispatcher])

  const handleSelectProject = useCallback(
    (projectId: string) => {
      updateQueryString({ projectId })
    },
    [updateQueryString],
  )

  const handleChangeProject = useCallback(() => {
    updateQueryString({ projectId: undefined })
  }, [updateQueryString])

  if (!loading && application) {
    if (!projectId) {
      return (
        <BodyContainer>
          <CardContainer>
            <Stack tokens={{ childrenGap: '16px' }} horizontalAlign="center">
              <Persona imageUrl={application.avatarUrl || undefined} text={application.username} hidePersonaDetails />

              <Title>Install {appName} for your project</Title>
              <CenterText>Choose Project</CenterText>
              <ProjectSelector onSelect={handleSelectProject} />
            </Stack>
          </CardContainer>
        </BodyContainer>
      )
    } else {
      return (
        <BodyContainer>
          <CardContainer>
            <Stack tokens={{ childrenGap: '16px' }} horizontalAlign="center">
              <Persona imageUrl={application.avatarUrl || undefined} text={application.username} hidePersonaDetails />
              <Title>Install {appName} for your project</Title>

              <Stack tokens={{ childrenGap: '4px' }}>
                <CenterText>
                  Project: {projectId} <IconButton iconProps={{ iconName: 'swap' }} onClick={handleChangeProject} />
                </CenterText>
                <CenterText>Choose permission you want to give the application</CenterText>
              </Stack>

              <Authorization projectId={projectId} appId={application.id} />
            </Stack>
          </CardContainer>
        </BodyContainer>
      )
    }
  } else {
    return (
      <BodyContainer>
        <CardContainer>
          <Spinner size={SpinnerSize.large} />
        </CardContainer>
      </BodyContainer>
    )
  }
}
