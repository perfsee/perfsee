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

import { Switch, Redirect } from 'react-router'

import { Route } from '@perfsee/components'
import { lazy } from '@perfsee/platform/common'
import { staticPath } from '@perfsee/shared/routes'

import { BundleReportContainer } from './detail'
import { BundleList } from './list'

const BundleContentContainer = lazy(() => import(/* webpackChunkName: "bundle-content" */ './bundle-content'))

export const BundleRoutes = () => {
  return (
    <div style={{ padding: '0 20px' }}>
      <Switch>
        <Route exact={true} path={staticPath.project.bundle.home} component={BundleList} />
        <Route exact={true} path={staticPath.project.bundle.detail} component={BundleReportContainer} />
        <Route exact={true} path={staticPath.project.bundle.jobBundleContent} component={BundleContentContainer} />
        <Redirect to={staticPath.notFound} />
      </Switch>
    </div>
  )
}
