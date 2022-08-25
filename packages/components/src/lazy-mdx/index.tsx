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

import { Shimmer } from '@fluentui/react'
import { ComponentType, useEffect, useState } from 'react'

export const LazyMDX = (props: { loadMDX: () => Promise<ComponentType> }) => {
  const [Document, setDocument] = useState<ComponentType | null>(null)
  const { loadMDX, ...restProps } = props
  useEffect(() => {
    loadMDX()
      .then((MDXDocument) => {
        setDocument(() => MDXDocument)
      })
      .catch((e) => {
        console.error('mdx error', e)
      })
  }, [loadMDX])
  if (Document == null) {
    return (
      <>
        <Shimmer />
        <Shimmer />
        <Shimmer />
      </>
    )
  }
  return <Document {...restProps} />
}
