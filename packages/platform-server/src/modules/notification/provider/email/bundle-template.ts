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

import { stringify } from 'query-string'

import templates from '@perfsee/email-templates'
import { isPassedBundleJobUpdate } from '@perfsee/server-common'
import { CommonGitHost, PrettyBytes } from '@perfsee/shared'
import { pathFactory, staticPath } from '@perfsee/shared/routes'

import { SendMailOptions } from '../../../email'
import { BundleNotificationInfo } from '../../type'

import { compileEmailTemplate } from './utils'

const template = compileEmailTemplate(templates.bundle)

const sizeText = (size: number, baselineSize: number | undefined) => {
  const diffSize = baselineSize && size - baselineSize
  return `${PrettyBytes.stringify(size)}${
    diffSize ? ` (${diffSize < 0 ? '-' : '+'} ${PrettyBytes.stringify(Math.abs(diffSize))})` : ''
  }`
}

export function bundleEmailTemplate(info: BundleNotificationInfo, host: string): Omit<SendMailOptions, 'to'> | null {
  const { artifact, result, project } = info
  if (!isPassedBundleJobUpdate(result)) {
    return null
  }
  const gitHost = new CommonGitHost(project)

  const hasWarning = Object.values(result.entryPoints ?? {}).some((entrypoint) => entrypoint.warnings.length > 0)

  const statusMessage = artifact.failed()
    ? 'Bundle Analysis Job Failed'
    : artifact.succeeded()
    ? hasWarning
      ? 'Bundle Analysis finished with WARNINGS'
      : 'Bundle Analysis Job Finished'
    : ''

  if (statusMessage === '') return null

  const title = `[${info.project.namespace}/${info.project.name}] ${statusMessage}`
  const reportLink =
    host +
    pathFactory.project.bundle.detail({
      projectId: info.project.slug,
      bundleId: artifact.iid,
    })

  return {
    subject: title,
    text: title + '\n' + 'see details at ' + reportLink,
    html: template({
      env: {
        host: host + staticPath.home,
      },
      title,
      statusMessage,
      bundleId: artifact.iid,
      branch: artifact.branch,
      commitHash: artifact.hash,
      commitLink: gitHost.commitUrl(artifact.hash),
      date: artifact.updatedAt,
      reportLink,
      entryPoints: Object.keys(result.entryPoints ?? {}).map((entryPointName) => {
        const entryPoint = result.entryPoints![entryPointName]
        const entryPointWarnings = entryPoint.warnings
        return {
          name: entryPointName,
          bundleSize: entryPoint.sizeDiff.current.raw,
          initialSize: entryPoint.initialSizeDiff.current.raw,
          baselineBundleSize: entryPoint.sizeDiff.baseline?.raw,
          baselineInitialSize: entryPoint.initialSizeDiff.baseline?.raw,
          warnings: entryPointWarnings.map((w) => w.rule) ?? [],
          reportLink: reportLink + `&` + stringify({ entry: entryPointName }),
        }
      }),
      sizeText,
    }),
  }
}
