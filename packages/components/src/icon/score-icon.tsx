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

import { CheckCircleOutlined, ExclamationCircleOutlined, WarningOutlined } from '@ant-design/icons'
import { isNumber } from 'lodash'

import { SharedColors } from '@perfsee/dls'
import { Maybe } from '@perfsee/schema'

export function getScoreColor<T = undefined>(): T
export function getScoreColor<T = number>(score: T): string
export function getScoreColor(score?: Maybe<number>) {
  if (isNumber(score)) {
    return (score < 50 ? SharedColors.red10 : score < 90 ? SharedColors.orange10 : SharedColors.greenCyan10) as string
  }
}

interface ScoreIconProps {
  score: number
}

export const ScoreIcon = ({ score }: ScoreIconProps) => {
  const color = getScoreColor(score)

  let icon = <CheckCircleOutlined style={{ color }} />
  if (score < 50) {
    icon = <WarningOutlined style={{ color }} />
  } else if (score < 90) {
    icon = <ExclamationCircleOutlined style={{ color }} />
  }

  return icon
}
