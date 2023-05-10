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

import { QuestionCircleOutlined } from '@ant-design/icons'
import { DirectionalHint, IStackTokens, Spinner, SpinnerSize, Stack, TooltipHost } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { FC, useCallback, useEffect, useMemo } from 'react'
import { useHistory } from 'react-router'

import { BundleJobStatus } from '@perfsee/schema'
import { PrettyBytes } from '@perfsee/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { PackageBundleDetailModule } from '../module'

import BarGraph, { PLACE_HOLDER_PACKAGE_ID, Reading } from './bar-graph/bar-graph'
import ExportAnalysisSection from './export-analysis/export-analysis-section'
import {
  DataNumber,
  DataText,
  DataUnit,
  TransitionNumber,
  Warning,
  BundleCard,
  BundleCardTitle,
  DataContainer,
} from './styles'
import TreemapSection from './treemap-section'

const blockToken: IStackTokens = {
  childrenGap: 36,
}

const questionCircle = <QuestionCircleOutlined size={12} style={{ cursor: 'pointer' }} />

const historyLength = 22

const downloadTimeText = [
  <div key="1">
    Slow 3G
    <TooltipHost
      content="Download Speed: ⬇️ 50 kB/s. Exclusive of HTTP request latency."
      directionalHint={DirectionalHint.bottomCenter}
    >
      {questionCircle}
    </TooltipHost>
  </div>,
  <div key="2">
    Emerging 4G
    <TooltipHost
      content="Download Speed: ⬇️ 875 kB/s. Exclusive of HTTP request latency."
      directionalHint={DirectionalHint.bottomCenter}
    >
      {questionCircle}
    </TooltipHost>
  </div>,
]

export function arrayToSentence(arr: string[]) {
  if (arr.length === 0) {
    return ''
  }

  if (arr.length === 1) {
    return arr[0]
  }

  return arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1]
}

export const PackageBundleReports: FC<{ packageId: string; packageBundleId: string; projectId: string }> = ({
  packageId,
  projectId,
}) => {
  const [{ current, loading, history, historyLoading }, dispatcher] = useModule(PackageBundleDetailModule)
  const report = current?.report

  const sizeValues = useMemo(() => ({ raw: report?.size ?? 0, gzip: report?.gzip ?? 0 }), [report])
  const currentDateTime = current?.createdAt

  useEffect(() => {
    currentDateTime && dispatcher.getHistory({ packageId, currentDateTime, limit: historyLength })
  }, [dispatcher, packageId, currentDateTime])

  const historyRouter = useHistory()

  const onBarClick = useCallback(
    (reading: Reading) => {
      historyRouter.push(
        pathFactory.project.package.detail({ packageId: reading.packageId, packageBundleId: reading.id, projectId }),
      )
    },
    [historyRouter, projectId],
  )

  const { raw, gzip } = sizeValues
  const downloadTimeBlocks = useMemo(() => {
    return [50 * 1000, 875 * 1000].map((speed, i) => (
      <DataBlock
        value={toPrecision2((gzip ?? raw) / speed)}
        unit="S"
        text={downloadTimeText[i]}
        NumberComp={TransitionNumber}
        key={speed}
      />
    ))
  }, [gzip, raw])

  const sizeDataBlocks = useMemo(() => {
    const text = ['Minified', 'Minified + Gzip']
    return Object.keys(sizeValues).map((rawSizeKey, i) => {
      const sizeSize = sizeValues[rawSizeKey] && PrettyBytes.create(sizeValues[rawSizeKey])
      return sizeSize ? <DataBlock value={sizeSize.value} unit={sizeSize.unit} text={text[i]} key={text[i]} /> : null
    })
  }, [sizeValues])

  if (loading) {
    return <Spinner size={SpinnerSize.large} label="Loading job result" />
  }

  if (current?.status !== BundleJobStatus.Passed) {
    return null
  }

  if (!report) {
    return null
  }

  const readings = history?.map((h) => ({
    ...h,
    version: h.version ?? 'unknown',
    packageId: h.packageId,
    id: h.id,
    size: h.size?.raw ?? 0,
    gzip: h.size?.gzip ?? 0,
    disabled: h.status !== BundleJobStatus.Passed,
  }))

  if (readings) {
    const length = readings.length
    const fillLength = historyLength - length

    readings.splice(
      0,
      0,
      ...(Array.from({ length: fillLength }, (_v, index) => ({
        version: '',
        packageId: PLACE_HOLDER_PACKAGE_ID,
        id: `${PLACE_HOLDER_PACKAGE_ID}_${index}`,
        disabled: true,
        name: '',
      })) as any[]),
    )
  }

  const barGraph =
    historyLoading || !readings ? (
      <Spinner size={SpinnerSize.large} label="loading history" />
    ) : (
      <BarGraph onBarClick={onBarClick} showVersion height={158} readings={readings} />
    )

  const bundleSizeBlock = (
    <BundleCard>
      <BundleCardTitle> Bundle Size </BundleCardTitle>
      <Stack horizontal horizontalAlign="space-between">
        {sizeDataBlocks}
      </Stack>
    </BundleCard>
  )

  const downloadTimeBlock = (
    <BundleCard>
      <BundleCardTitle> Download Time </BundleCardTitle>
      <Stack horizontal horizontalAlign="space-between">
        {downloadTimeBlocks}
      </Stack>
    </BundleCard>
  )

  const warning = report.ignoredMissingDependencies?.length ? (
    <Warning>
      Ignoring the size of missing {report.ignoredMissingDependencies.length > 1 ? 'dependencies' : 'dependency'}:
      &nbsp;
      <code>{arrayToSentence(report.ignoredMissingDependencies)}</code>
    </Warning>
  ) : null

  return (
    <Stack>
      {warning}
      <Stack
        horizontal
        horizontalAlign="space-between"
        verticalAlign="center"
        tokens={blockToken}
        styles={{ root: { alignItems: 'stretch' } }}
      >
        <Stack horizontalAlign="space-between" tokens={{ childrenGap: 12 }} styles={{ root: { margin: '24px 0' } }}>
          {bundleSizeBlock}
          {downloadTimeBlock}
        </Stack>
        <Stack styles={{ root: { margin: '24px 0', flex: 1 } }}>
          <BundleCard>
            <BundleCardTitle>Histories</BundleCardTitle>
            <Stack tokens={{ padding: '0 0 36px 0' }}>{barGraph}</Stack>
          </BundleCard>
        </Stack>
      </Stack>
      <TreemapSection
        packageName={report.name}
        packageSize={report.size}
        dependencySizes={report.dependencySizes ?? []}
      />
      <ExportAnalysisSection result={report} />
    </Stack>
  )
}

const DataBlock: FC<{
  value?: string | number | null
  unit: string
  text: React.ReactNode
  NumberComp?: React.FunctionComponent<{ value: string | number }>
  extra?: React.ReactNode
}> = ({ value, unit, text, NumberComp = DataNumber, extra }) => {
  if (value === undefined || value === null) {
    return null
  }

  return (
    <DataContainer horizontalAlign="start">
      <Stack horizontal verticalAlign="baseline">
        <NumberComp value={value} data-value={value}>
          {value}
          {extra}
        </NumberComp>
        <DataUnit>{unit}</DataUnit>
      </Stack>
      <DataText>{text}</DataText>
    </DataContainer>
  )
}

const toPrecision2 = (num?: null | number) => Number(num?.toPrecision(2))
