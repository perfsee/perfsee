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

import { useModule } from '@sigi/react'
import dayjs from 'dayjs'
import { useEffect, useMemo } from 'react'

import { ChartsContainer } from '../styled'

import { BundleHistoryChart, SizeDataType } from './bundle-history-chart'
import { BundleScoreChart, ScoreDataType } from './bundle-score-chart'
import { GroupChartModule } from './module'

type Props = {
  startTime: number
  endTime: number
  groupId: string
}

type ScoreRecordType = {
  sumScore: number
  entryCount: number
} & Omit<ScoreDataType, 'score'>

export const Charts = ({ startTime, endTime, groupId }: Props) => {
  const [{ bundleHistoryMap }, { getBundleHistory }] = useModule(GroupChartModule)

  useEffect(() => {
    if (groupId && startTime && endTime) {
      getBundleHistory({
        id: groupId,
        from: dayjs.unix(startTime).toISOString(),
        to: dayjs.unix(endTime).toISOString(),
      })
    }
  }, [endTime, getBundleHistory, groupId, startTime])

  const { scoreFlatData, flatData, largest, smallest, minScore, maxScore } = useMemo(() => {
    const data: SizeDataType[] = []
    const scoreDataMap: Map<string /* projectId_artifactId */, ScoreRecordType> = new Map()
    let largest = 0
    let minScore = 100
    let maxScore = 0
    let smallest = Number.MAX_SAFE_INTEGER
    // avoid weird chart looking
    if (!bundleHistoryMap?.size) {
      largest = 1000
      smallest = 0
    } else {
      for (const [projectId, bundleHistory] of bundleHistoryMap) {
        bundleHistory.forEach(({ score, artifactId, artifactName, entrypoint, hash, size, createdAt }) => {
          const record: SizeDataType = {
            id: artifactId!,
            hash,
            artifactName,
            entryPoint: entrypoint,
            raw: size.raw / 1000,
            gzip: size.gzip / 1000,
            brotli: size.brotli / 1000,
            createdAt,
            projectAndEntry: `${projectId}-${entrypoint}`,
            projectId,
          }

          if (score && artifactId) {
            const key = `${projectId}_${artifactId}`
            const scoreRecord = scoreDataMap.get(key)
            const sumScore = (scoreRecord?.sumScore ?? 0) + score
            const entryCount = (scoreRecord?.entryCount ?? 0) + 1

            scoreDataMap.set(key, {
              id: artifactId!,
              hash,
              artifactName,
              score,
              projectAndName: `${projectId}-${artifactName}`,
              sumScore,
              projectId,
              entryCount,
              createdAt,
            })

            minScore = Math.min(minScore, score)
            maxScore = Math.max(maxScore, score)
          }

          largest = Math.max(largest, record.raw)
          smallest = Math.min(smallest, record.raw)

          data.push(record)
        })
      }
    }

    const scoreFlatData = Array.from(scoreDataMap.values()).map((d) => ({ ...d, score: d.sumScore / d.entryCount }))

    return { flatData: data, scoreFlatData, largest, smallest, maxScore, minScore }
  }, [bundleHistoryMap])

  if (!groupId) {
    return null
  }

  return (
    <ChartsContainer>
      <BundleHistoryChart loading={!bundleHistoryMap} flatData={flatData} minY={smallest} maxY={largest} />
      <BundleScoreChart loading={!bundleHistoryMap} flatData={scoreFlatData} minY={minScore} maxY={maxScore} />
    </ChartsContainer>
  )
}
