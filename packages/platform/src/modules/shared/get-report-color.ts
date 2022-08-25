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

import { Theme } from '@emotion/react'

import { lighten, SharedColors } from '@perfsee/dls'
import { SnapshotStatus } from '@perfsee/schema'

export const getScoreColor = (score: number) => {
  return score < 50 ? SharedColors.red10 : score < 90 ? SharedColors.orange10 : lighten(SharedColors.green20, 0.5)
}

export const getStatusColor = (status: string, theme: Theme) => {
  switch (status) {
    case SnapshotStatus.Completed:
      return theme.colors.success
    case SnapshotStatus.Pending:
      return theme.colors.warning
    case SnapshotStatus.Running:
      return theme.colors.primary
    case SnapshotStatus.Failed:
      return theme.colors.error
    case SnapshotStatus.Scheduled:
      return theme.colors.disabled
  }
}
