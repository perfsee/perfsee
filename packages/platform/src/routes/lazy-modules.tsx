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

import { lazy } from '../common'

export const ProjectListPage = lazy(() => import(/* webpackChunkName: "project" */ '../modules/project/list'))
export const ProjectFeaturePage = lazy(() => import(/* webpackChunkName: "project" */ '../modules/project/features'))
export const ImportGithub = lazy(() => import(/* webpackChunkName: "import-github" */ '../modules/import-github'))
export const StatusPage = lazy(() => import(/* webpackChunkName: "status" */ '../modules/status'))
export const Me = lazy(() => import(/* webpackChunkName: "auth" */ '../modules/me'))
export const EditPassword = lazy(() => import(/* webpackChunkName: "auth" */ '../modules/edit-password'))
export const ResetPassword = lazy(() => import(/* webpackChunkName: "auth" */ '../modules/reset-password'))
export const Login = lazy(() => import(/* webpackChunkName: "auth" */ '../modules/login'))
export const Register = lazy(() => import(/* webpackChunkName: "auth" */ '../modules/register'))
export const LicensePage = lazy(() => import(/* webpackChunkName: "license" */ '../modules/license'))
export const HomePage = lazy(() => import(/* webpackChunkName: "home" */ '../modules/home'))
export const FeaturesBundle = lazy(() => import(/* webpackChunkName: "home" */ '../modules/home/features/bundle'))
export const FeaturesLab = lazy(() => import(/* webpackChunkName: "home" */ '../modules/home/features/lab'))
export const FeaturesSource = lazy(() => import(/* webpackChunkName: "home" */ '../modules/home/features/source'))
export const Admin = lazy(() => import(/* webpackChunkName: "admin" */ '../modules/admin'))
export const AppInstaller = lazy(() => import(/* webpackChunkName: "appInstaller" */ '../modules/apps'))
export const Group = lazy(() => import(/* webpackChunkName: "group" */ '../modules/group'))
export const Extensions = lazy(() => import(/* webpackChunkName: "extensions" */ '../modules/extensions'))
