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

import { Route, Switch } from 'react-router'

import { NotFound } from '@perfsee/components'
import { staticPath } from '@perfsee/shared/routes'

import { LoginRedirect } from '../modules/login/login-redirect'
import { User } from '../modules/shared'

import {
  StatusPage,
  LicensePage,
  ProjectListPage,
  ProjectFeaturePage,
  Applications,
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
} from './lazy-modules'

export const Routes = ({ user }: { user: User | null }) => {
  return (
    <Switch>
      {/* pages without login */}
      <Route exact={true} path={staticPath.home} component={HomePage} />
      <Route exact={true} path={staticPath.features.bundle} component={FeaturesBundle} />
      <Route exact={true} path={staticPath.features.lab} component={FeaturesLab} />
      <Route exact={true} path={staticPath.features.source} component={FeaturesSource} />

      <Route exact={true} path={staticPath.login} component={Login} />
      <Route exact={true} path={staticPath.register} component={Register} />
      <Route exact={true} path={staticPath.status} component={StatusPage} />
      <Route exact={true} path={staticPath.license} component={LicensePage} />
      <Route exact={true} path={staticPath.editPassword} component={EditPassword} />
      <Route exact={true} path={staticPath.resetPassword} component={ResetPassword} />

      {/* pages with login */}
      {user ? (
        <Switch>
          <Route exact={true} path={staticPath.importGithub} component={ImportGithub} />
          <Route path={staticPath.me.home} component={Me} />
          <Route exact={true} path={staticPath.projects} component={ProjectListPage} />
          {user.isAdmin && <Route exact={true} path={staticPath.applications} component={Applications} />}
          <Route path={staticPath.project.feature} component={ProjectFeaturePage} />
          <Route path="*" render={NotFound} />
        </Switch>
      ) : (
        <LoginRedirect />
      )}
    </Switch>
  )
}
