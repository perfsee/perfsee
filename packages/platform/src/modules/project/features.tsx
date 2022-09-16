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

import { Spinner, SpinnerSize } from '@fluentui/react'
import { useModule, useModuleState } from '@sigi/react'
import { memo, useEffect, useMemo } from 'react'
import { useParams, Redirect, Route } from 'react-router'
import { Switch } from 'react-router-dom'

import { NotFound } from '@perfsee/components'
import { Permission } from '@perfsee/schema'
import { staticPath, RouteTypes, pathFactory } from '@perfsee/shared/routes'

import { Footer, ProjectNav } from '../layout'
import { ProjectModule, UserModule } from '../shared'

import {
  BundleRoutes,
  ProjectHome,
  ArtifactStatistics,
  SnapshotStatistics,
  LabRoutes,
  CompetitorRoutes,
  SourcePage,
  VersionReport,
  SettingsPage,
  JobTrace,
} from './lazy-modules'
import { BodyWrapper, ContentWrapper, NavWrapper, RouteWrapper } from './style'

export const FeaturesPage = memo(() => {
  const { projectId, feature } = useParams<RouteTypes['project']['feature']>()

  const { user } = useModuleState(UserModule)
  const [{ project, loading }, dispatcher] = useModule(ProjectModule)

  const isAdminUser = useMemo(() => project?.userPermission.includes(Permission.Admin) ?? false, [project])

  useEffect(() => {
    if (projectId) {
      dispatcher.getProject({
        projectId,
      })
    }

    return dispatcher.reset
  }, [dispatcher, projectId])

  if (!feature) {
    return <Redirect to={pathFactory.project.home({ projectId })} push={false} />
  }

  if (loading) {
    return <Spinner label="Loading project..." size={SpinnerSize.large} styles={{ root: { marginTop: 40 } }} />
  }

  if (!project) {
    return <NotFound />
  }

  return (
    <BodyWrapper>
      <NavWrapper>
        <ProjectNav />
      </NavWrapper>
      <ContentWrapper>
        <RouteWrapper>
          <Switch>
            <Route exact={true} path={staticPath.project.home} component={ProjectHome} />
            <Route path={staticPath.project.statistics.artifacts} component={ArtifactStatistics} />
            <Route path={staticPath.project.statistics.snapshots} component={SnapshotStatistics} />
            <Route path={staticPath.project.bundle.home} component={BundleRoutes} />
            <Route path={staticPath.project.lab.home} component={LabRoutes} />
            <Route path={staticPath.project.competitor.home} component={CompetitorRoutes} />
            <Route path={staticPath.project.source} component={SourcePage} />
            <Route path={staticPath.project.report} component={VersionReport} />
            <Route path={staticPath.project.jobTrace} component={JobTrace} />
            {isAdminUser && <Route path={staticPath.project.settings} component={SettingsPage} />}
          </Switch>
        </RouteWrapper>
        <Footer narrow isAdmin={user?.isAdmin} />
      </ContentWrapper>
    </BodyWrapper>
  )
})
