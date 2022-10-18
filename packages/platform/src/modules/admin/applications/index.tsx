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

import { useModule } from '@sigi/react'
import dayjs from 'dayjs'
import { FC, memo, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { ContentCard, Pagination } from '@perfsee/components'
import { pathFactory } from '@perfsee/shared/routes'

import { CreateAppModal } from './create-app-modal'
import { Application, ApplicationsModule, AuthProject } from './module'
import {
  AppDetailWrap,
  AppName,
  AppWrap,
  ListWrap,
  ProjectItemName,
  ProjectItemPermission,
  ProjectItemWrap,
  ProjectsContainer,
  Wrap,
} from './styled'

export function Applications() {
  const [{ applications, authProjects }, dispatcher] = useModule(ApplicationsModule)
  const [page, setPage] = useState(1)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)

  const onSelectApp = useCallback(
    (app: Application) => () => {
      setSelectedApp(app)
      dispatcher.getAppAuthProjects(app.id)
    },
    [dispatcher],
  )

  useEffect(() => {
    dispatcher.getApplications({
      first: 10,
      skip: (page - 1) * 10,
    })
  }, [dispatcher, page])

  return (
    <ContentCard>
      <div>
        <CreateAppModal />
      </div>
      <Wrap>
        {applications.totalCount > 0 && (
          <ListWrap>
            {applications.items.map((app) => (
              <AppWrap key={app.id} appId={app.id} selectable={true} onClick={onSelectApp(app)}>
                <AppName>{app.username}</AppName>
              </AppWrap>
            ))}
            <Pagination page={page} total={applications.totalCount} pageSize={10} onChange={setPage} hideOnSinglePage />
          </ListWrap>
        )}
        {selectedApp && (
          <AppDetailWrap>
            <p>
              <b>Name:</b> {selectedApp.username}
            </p>
            <p>
              <b>createdAt:</b> {dayjs(selectedApp.createdAt).format('YYYY/MM/DD HH:mm:ss')}
            </p>
            <hr />
            <ProjectsContainer>
              {authProjects.map((project, i) => (
                <ProjectItem key={i} project={project} />
              ))}
            </ProjectsContainer>
          </AppDetailWrap>
        )}
      </Wrap>
    </ContentCard>
  )
}

const ProjectItem: FC<{ project: AuthProject }> = memo(({ project }) => {
  const {
    permissions,
    project: { id },
  } = project

  const projectPath = pathFactory.project.home({ projectId: id })

  return (
    <ProjectItemWrap>
      <Link to={projectPath}>
        <ProjectItemName>{id}</ProjectItemName>
      </Link>
      <ProjectItemPermission>{permissions.join(', ')}</ProjectItemPermission>
    </ProjectItemWrap>
  )
})
