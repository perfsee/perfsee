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

import { ArrowUpRightIcon } from '@fluentui/react-icons-mdl2'
import { FC, useCallback } from 'react'
import { useHistory, useParams } from 'react-router'

import { RouteTypes, pathFactory } from '@perfsee/shared/routes'

import { AuditJumpButton } from './style'

export interface JumpProps {
  text: JSX.Element | string
  linkFactory: (projectId: string, snapshotReportId: string) => string
}

export const auditJumps: Record<string, JumpProps> = {
  'largest-contentful-paint-element': {
    text: (
      <>
        View in flamechart <ArrowUpRightIcon />
      </>
    ),
    linkFactory: (projectId, reportId) =>
      pathFactory.project.lab.report({
        projectId,
        reportId,
        tabName: 'flamechart',
      }) + '?insight=lcp',
  },
  'unused-javascript': {
    text: (
      <>
        View treemap <ArrowUpRightIcon />
      </>
    ),
    linkFactory: (projectId, reportId) =>
      pathFactory.project.lab.report({
        projectId,
        reportId,
        tabName: 'source-coverage',
      }),
  },
  'render-blocking-resources': {
    text: (
      <>
        View assets <ArrowUpRightIcon />
      </>
    ),
    linkFactory: (projectId, reportId) =>
      pathFactory.project.lab.report({
        projectId,
        reportId,
        tabName: 'assets',
      }),
  },
  'long-tasks': {
    text: (
      <>
        View sources <ArrowUpRightIcon />
      </>
    ),
    linkFactory: (projectId) => pathFactory.project.source({ projectId }),
  },
  'mainthread-work-breakdown': {
    text: (
      <>
        View flamechart <ArrowUpRightIcon />
      </>
    ),
    linkFactory: (projectId, reportId) =>
      pathFactory.project.lab.report({
        projectId,
        reportId,
        tabName: 'flamechart',
      }),
  },
}

export const AuditJump: FC<JumpProps> = ({ linkFactory, text }) => {
  const { projectId, reportId } = useParams<RouteTypes['project']['lab']['report']>()
  const link = linkFactory(projectId, reportId)
  const history = useHistory()
  const onClick = useCallback(() => {
    history.push(link)
  }, [history, link])

  return <AuditJumpButton onClick={onClick}>{text}</AuditJumpButton>
}
