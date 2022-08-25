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

import { MessageBar, MessageBarType } from '@fluentui/react'
import { FC } from 'react'

import { ArtifactFragment, BundleJobStatus } from '@perfsee/schema'

interface Props {
  bundle?: ArtifactFragment | null
}

export const SuspiciousBundle: FC<Props> = ({ bundle }) => {
  let type = MessageBarType.info
  let message = ''
  if (!bundle) {
    message = 'Unknown Bundle.'
    type = MessageBarType.error
  } else {
    switch (bundle.status) {
      case BundleJobStatus.Failed:
        message = ` failed: ${bundle.failedReason}`
        type = MessageBarType.error
        break
      case BundleJobStatus.Pending:
      case BundleJobStatus.Running:
        message = 'Bundle analysis is ongoing.'
        type = MessageBarType.warning
        break
      default:
    }
  }

  return <MessageBar messageBarType={type}>{message}</MessageBar>
}
