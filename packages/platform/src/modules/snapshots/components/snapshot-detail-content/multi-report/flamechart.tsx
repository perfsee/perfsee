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

import { Checkbox, Stack, Toggle, Label } from '@fluentui/react'
import { Module } from '@sigi/core'
import { FC, useCallback, useMemo, useState } from 'react'

import { ForeignLink, MultiSelector, useWideScreen } from '@perfsee/components'
import { FlamechartBindingManager } from '@perfsee/flamechart/views/flamechart-binding-manager'
import { getChartEndTime } from '@perfsee/lab-report/chart/helper'
import { FlamechartModule, FlamechartPlaceholder } from '@perfsee/lab-report/flamechart'
import { FlamechartView } from '@perfsee/lab-report/pivot-content-flamechart/flamechart'
import { FlamechartSmallContainer } from '@perfsee/lab-report/pivot-content-flamechart/style'
import { ReactFlameGraphModule } from '@perfsee/lab-report/pivot-content-react/module'
import { PerformanceTabType, SnapshotDetailType, SnapshotReportSchema } from '@perfsee/lab-report/snapshot-type'
import { useProject } from '@perfsee/platform/modules/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { HeaderTitle, ShowMoreTip } from './style'

type Props = {
  snapshots: SnapshotDetailType[]
}

const flamechartModuleMap: Record<number, typeof FlamechartModule> = {}
const reactFlameGraphModuleMap: Record<number, typeof ReactFlameGraphModule> = {}

export const MultiContentFlamechart: FC<Props> = (props) => {
  const { snapshots } = props
  useWideScreen()

  const endTime = useMemo(() => {
    return snapshots.reduce((p, c) => {
      const endTime = getChartEndTime(c.traceData, c.timings) * 1000
      return Math.max(endTime, p)
    }, 0)
  }, [snapshots])

  const bindingManager = useMemo(() => {
    return new FlamechartBindingManager()
  }, [])

  const onToggleChange = useCallback(
    (_e: any, checked?: boolean) => {
      if (checked) {
        bindingManager.turnOn()
      } else {
        bindingManager.turnOff()
      }
    },
    [bindingManager],
  )

  const [showProfiles, setShowProfiles] = useState(['Main'])
  const profileCheckbox = useMemo(() => {
    return (
      <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }} styles={{ root: { marginRight: 12 } }}>
        <Label style={{ fontSize: 15, marginRight: 8 }}>Show Profiles</Label>
        {['Timings', 'Network', 'Tasks', 'Main'].map((name) => {
          const onChange = (_ev: any, checked?: boolean) => {
            if (checked) {
              setShowProfiles((profiles) => [...profiles, name])
            } else {
              setShowProfiles((profiles) => profiles.filter((p) => p !== name))
            }
          }
          // eslint-disable-next-line
          return <Checkbox label={name} defaultChecked={name === 'Main'} key={name} onChange={onChange} />
        })}
      </Stack>
    )
  }, [])

  const [reportIds, setReportIds] = useState(() => snapshots.slice(0, 2).map((snapshot) => snapshot.report.id))
  const reportSelectOptios = useMemo(() => {
    return snapshots.map((snapshot) => {
      const report = snapshot.report as NonNullable<SnapshotReportSchema>
      const title = report.snapshot.title ?? `Snapshot #${report.snapshot.id}`
      return {
        id: report.id,
        name: `${report.page.name} - ${title}`,
      }
    })
  }, [snapshots])
  const onSelectChange = useCallback((ids: number[]) => {
    setReportIds(ids)
  }, [])

  const defailtHeight = useMemo(() => {
    const profilesPadding = (showProfiles.length - 1) * 10
    switch (reportIds.length) {
      case 2: {
        return `calc(46vh - ${Math.max(120 - profilesPadding, 0)}px)`
      }
      case 3: {
        return `calc(32vh - ${Math.max(80 - profilesPadding, 0)}px)`
      }
      case 4: {
        return `calc(24vh - ${Math.max(50 - profilesPadding, 0)}px)`
      }
      default: {
        return `calc(18vh - ${Math.max(40 - profilesPadding, 0)}px)`
      }
    }
  }, [reportIds, showProfiles])

  const project = useProject()

  const flamecharts = useMemo(() => {
    return snapshots
      .filter((snapshot) => reportIds.includes(snapshot.report.id))
      .map((snapshot, i) => {
        const report = snapshot.report as NonNullable<SnapshotReportSchema>
        const title = report.snapshot.title ?? `Snapshot #${report.snapshot.id}`

        if (!flamechartModuleMap[i]) {
          @Module(`flamechart-${i}`)
          class FlamechartModuleI extends FlamechartModule {}
          flamechartModuleMap[i] = FlamechartModuleI
        }

        if (!reactFlameGraphModuleMap[i]) {
          @Module(`ReactFlameGraphModule-${i}`)
          class ReactFlameGraphModuleI extends ReactFlameGraphModule {}
          reactFlameGraphModuleMap[i] = ReactFlameGraphModuleI
        }

        const link = project
          ? pathFactory.project.lab.report({
              projectId: project.id,
              reportId: report.id,
              tabName: PerformanceTabType.Flamechart,
            })
          : undefined

        if ('flameChartLink' in snapshot.report && snapshot.report.flameChartLink) {
          const tasksBaseTimestamp =
            snapshot.traceData && snapshot.traceData.length > 0
              ? snapshot.traceData[0].event.ts - snapshot.traceData[0].startTime * 1000
              : undefined
          return (
            <div key={snapshot.report.id} style={{ marginTop: 16 }}>
              <ForeignLink href={link}>
                {i + 1}. {report.page.name} - {title}
              </ForeignLink>
              <FlamechartSmallContainer style={{ height: defailtHeight }}>
                <FlamechartView
                  flameChartLink={snapshot.report.flameChartLink}
                  requests={snapshot.requests || []}
                  requestsBaseTimestamp={snapshot.requestsBaseTimestamp}
                  tasks={snapshot.traceData}
                  tasksBaseTimestamp={tasksBaseTimestamp}
                  metrics={snapshot.metricScores}
                  userTimings={snapshot.userTimings}
                  reactProfileLink={snapshot.report.reactProfileLink}
                  bindingManager={bindingManager}
                  initialRight={endTime}
                  FlamechartModule={flamechartModuleMap[i]}
                  ReactFlameGraphModule={reactFlameGraphModuleMap[i]}
                  showProfiles={showProfiles}
                  initCollapsed={[]}
                  useSimpleDetailView
                />
              </FlamechartSmallContainer>
            </div>
          )
        } else {
          return (
            <div key={snapshot.report.id}>
              <b>
                {i + 1}. {report.page.name} - {title}
              </b>
              <FlamechartSmallContainer style={{ marginTop: 12 }}>
                <FlamechartPlaceholder>No flame chart data!</FlamechartPlaceholder>
              </FlamechartSmallContainer>
            </div>
          )
        }
      })
  }, [bindingManager, endTime, snapshots, showProfiles, reportIds, defailtHeight, project])

  return (
    <Stack tokens={{ childrenGap: 10, padding: '8px' }}>
      <Stack horizontal horizontalAlign="space-between">
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }}>
          <HeaderTitle>Selected Reports</HeaderTitle>
          <MultiSelector options={reportSelectOptios} ids={reportIds} onSelectChange={onSelectChange} maxWidth={500} />
        </Stack>
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }}>
          {profileCheckbox}
          <Toggle
            label="Viewport Sync"
            defaultChecked
            inlineLabel
            onText="On"
            offText="Off"
            onChange={onToggleChange}
            styles={{ root: { marginBottom: 0 }, label: { fontSize: 15 } }}
          />
        </Stack>
      </Stack>
      {flamecharts}
      {snapshots.length > reportIds.length ? (
        <ShowMoreTip tokens={{ childrenGap: 8 }} horizontal horizontalAlign="center" verticalAlign="center">
          <p>Use the selector to compare remaining reports</p>
        </ShowMoreTip>
      ) : null}
    </Stack>
  )
}
