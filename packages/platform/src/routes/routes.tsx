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

import { Switch } from 'react-router'

import { NotFound, Route } from '@perfsee/components'
import { staticPath } from '@perfsee/shared/routes'

import { LoginRedirect } from '../modules/login/login-redirect'
import { ApplicationSettings, User } from '../modules/shared'

import {
  StatusPage,
  LicensePage,
  ProjectListPage,
  ProjectFeaturePage,
  ImportGithub,
  Login,
  Register,
  EditPassword,
  ResetPassword,
  Me,
  HomePage,
  FeaturesBundle,
  FeaturesLab,
  FeaturesSource,
  Admin,
  AppInstaller,
  Group,
} from './lazy-modules'

export const Routes = ({ user, settings }: { user: User | null; settings: ApplicationSettings | null }) => {
  return (
    <Switch>
      {/* pages without login */}
      {/* Introduction Routes */}
      <Route exact={true} path={staticPath.home} component={HomePage} />
      <Route exact={true} path={staticPath.features.bundle} component={FeaturesBundle} />
      <Route exact={true} path={staticPath.features.lab} component={FeaturesLab} />
      <Route exact={true} path={staticPath.features.source} component={FeaturesSource} />

      {/* Business Routes */}
      <Route exact={true} path={staticPath.login} component={Login} />
      <Route exact={true} path={staticPath.register} component={Register} />
      <Route exact={true} path={staticPath.status} component={StatusPage} />
      <Route exact={true} path={staticPath.license} component={LicensePage} />
      <Route exact={true} path={staticPath.editPassword} component={EditPassword} />
      <Route exact={true} path={staticPath.resetPassword} component={ResetPassword} />
      <Route path={staticPath.project.feature} component={ProjectFeaturePage} />

      {/* pages with login */}
      {user && settings ? (
        <Switch>
          {settings.enableProjectImport && (
            <Route exact={true} path={staticPath.importGithub} component={ImportGithub} />
          )}
          <Route path={staticPath.me.home} component={Me} />
          <Route exact={true} path={staticPath.group.part} component={Group} />
          <Route exact={true} path={staticPath.projects} component={ProjectListPage} />
          <Route path={staticPath.app.install} component={AppInstaller} />
          {user.isAdmin && <Route path={staticPath.admin.part} component={Admin} />}
          <Route path="*" render={NotFound} />
        </Switch>
      ) : (
        <LoginRedirect />
      )}
    </Switch>
  )
}
