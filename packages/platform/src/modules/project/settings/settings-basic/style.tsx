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
import styled from '@emotion/styled'
import { TooltipHost } from '@fluentui/react'
import { FC, PropsWithChildren } from 'react'

const FieldName = styled.div({
  marginBottom: 3,
  fontWeight: 600,
})

export const Field: FC<PropsWithChildren<{ name?: string; note?: string | JSX.Element }>> = ({
  name,
  note,
  children,
}) => {
  return (
    <div>
      {name && (
        <FieldName>
          {name}{' '}
          {note && (
            <TooltipHost content={note} closeDelay={1000}>
              <QuestionCircleOutlined />
            </TooltipHost>
          )}
          :
        </FieldName>
      )}
      {children}
    </div>
  )
}

export const BranchRegexWarning = styled.span(({ theme }) => ({
  marginTop: '4px',
  fontSize: '12px',
  color: theme.colors.warning,
}))
