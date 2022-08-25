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

import { IBreadcrumbItem } from '@fluentui/react'
import { useModuleState } from '@sigi/react'
import { useMemo } from 'react'

import { pathFactory } from '@perfsee/shared/routes'

import { ProjectModule } from './project.module'

interface Param {
  bundlesPage?: boolean
  bundleId?: number

  competitorPage?: boolean
  competitorReport?: boolean

  snapshotsPage?: boolean
  snapshotId?: number

  sourcePage?: boolean

  settingsPage?: boolean

  websitePage?: boolean

  versionReportPage?: boolean
}

export const useBreadcrumb = ({
  bundlesPage,
  bundleId,
  snapshotsPage,
  snapshotId,
  sourcePage,
  settingsPage,
  competitorPage,
  competitorReport,
  versionReportPage,
}: Param = {}) => {
  const project = useModuleState(ProjectModule, {
    selector: (state) => state.project,
    dependencies: [],
  })

  return useMemo<IBreadcrumbItem[]>(() => {
    if (!project) {
      return []
    }

    const payload = {
      projectId: project.id,
    }

    const projectItem: IBreadcrumbItem = {
      text: project.id,
      key: 'project',
      href: pathFactory.project.home(payload),
    }

    let appendedItems: IBreadcrumbItem[] = []
    const bundlesItem: IBreadcrumbItem = {
      text: 'Bundles',
      key: 'bundles',
      href: pathFactory.project.bundle.home(payload),
    }
    const snapshotsItem: IBreadcrumbItem = {
      text: 'Snapshots',
      key: 'snapshots',
      href: pathFactory.project.lab.home(payload),
    }
    const sourceItem: IBreadcrumbItem = {
      text: 'Source',
      key: 'source',
      href: pathFactory.project.source(payload),
    }
    const competitorItem: IBreadcrumbItem = {
      text: 'Competitor',
      key: 'competitors',
      href: pathFactory.project.competitor.home(payload),
    }
    const settingsItem: IBreadcrumbItem = {
      text: 'Settings',
      key: 'settings',
      href: pathFactory.project.settings({ ...payload, settingName: 'basic' }),
    }
    const versionReportItem: IBreadcrumbItem = {
      text: 'Version Report',
      key: 'versionReport',
      href: pathFactory.project.report(payload),
    }

    if (bundlesPage) {
      appendedItems = [
        {
          ...bundlesItem,
          isCurrentItem: true,
        },
      ]
    }

    if (snapshotsPage) {
      appendedItems = [
        {
          ...snapshotsItem,
          isCurrentItem: true,
        },
      ]
    }

    if (sourcePage) {
      appendedItems = [
        {
          ...sourceItem,
          isCurrentItem: true,
        },
      ]
    }

    if (versionReportPage) {
      appendedItems = [
        {
          ...versionReportItem,
          isCurrentItem: true,
        },
      ]
    }

    if (bundleId) {
      appendedItems = [
        bundlesItem,
        {
          text: bundleId.toString(),
          key: 'bundle',
        },
      ]
    }

    if (snapshotId) {
      appendedItems = [
        snapshotsItem,
        {
          text: snapshotId.toString(),
          key: 'snapshot',
        },
      ]
    }

    if (settingsPage) {
      appendedItems = [settingsItem]
    }

    if (competitorPage) {
      appendedItems = [competitorItem]
    }

    if (competitorReport) {
      appendedItems = [
        competitorItem,
        {
          text: 'report',
          key: 'competitor',
        },
      ]
    }

    return [projectItem, ...appendedItems]
  }, [
    project,
    bundlesPage,
    snapshotsPage,
    sourcePage,
    bundleId,
    snapshotId,
    settingsPage,
    competitorPage,
    competitorReport,
    versionReportPage,
  ])
}

export interface LibraryBreadCrumbProps {
  artifactId?: number
  artifactPage?: boolean
  benchmarkId?: number
  benchmarkPage?: boolean
}
