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

import { CheckCircleFilled, CloseCircleFilled, ExclamationCircleFilled, InfoCircleFilled } from '@ant-design/icons'
import { useTheme } from '@emotion/react'

import { BundleAuditScore } from '@perfsee/shared'

export type AuditScoreMap = {
  [key in BundleAuditScore]: {
    color: string
    icon: JSX.Element
  }
}

export const useAuditScore = () => {
  const theme = useTheme()

  return {
    [BundleAuditScore.Good]: {
      color: theme.colors.success,
      icon: <CheckCircleFilled name="success" css={{ color: theme.colors.success }} />,
    },
    [BundleAuditScore.Warn]: {
      color: theme.colors.warning,
      icon: <ExclamationCircleFilled name="warning" css={{ color: theme.colors.warning }} />,
    },
    [BundleAuditScore.Notice]: {
      color: theme.colors.disabled,
      icon: <InfoCircleFilled name="notice" css={{ color: theme.colors.disabled }} />,
    },
    [BundleAuditScore.Bad]: {
      color: theme.colors.error,
      icon: <CloseCircleFilled name="error" css={{ color: theme.colors.error }} />,
    },
  } as AuditScoreMap
}
