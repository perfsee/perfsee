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

import { FC, memo, useMemo } from 'react'

import { CardContentWrap, CardHeaderWrap, CardWrap } from './styled'

type ContentCardProps = {
  title?: string
  children?: React.ReactNode
  onRenderHeader?: () => React.ReactNode
}

export const ContentCard: FC<ContentCardProps> = memo((props) => {
  const { children, title, onRenderHeader } = props

  const header = useMemo(() => {
    if (!title && !onRenderHeader) {
      return null
    }

    return <CardHeaderWrap>{onRenderHeader?.() ?? title}</CardHeaderWrap>
  }, [onRenderHeader, title])

  return (
    <CardWrap>
      {header}
      <CardContentWrap>{children}</CardContentWrap>
    </CardWrap>
  )
})
