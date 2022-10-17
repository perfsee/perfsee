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

import { compact } from 'lodash'
import type { FC } from 'react'
import { Helmet as ReactHelmet } from 'react-helmet'

import Logo from './logo.png'

type Props = {
  title?: string
  description?: string
  keywords?: string[]
}

const DEFAULT_TITLE = 'Perfsee'
const DEFAULT_DESCRIPTION = 'Perfsee is set of tools for measuring and debugging performance of frontend applications'
const DEFAULT_KEYWORDS = ['perfsee', 'performance', 'frontend', 'webpack', 'lighthouse']

export const Helmet: FC<Props> = (props) => {
  const { title = DEFAULT_TITLE, description = DEFAULT_DESCRIPTION, keywords = DEFAULT_KEYWORDS } = props

  const keywordsString = compact(keywords).join(', ')

  return (
    <ReactHelmet defaultTitle={DEFAULT_TITLE}>
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      {keywordsString && <meta name="keywords" content={keywordsString} />}

      <meta property="og:title" content={title} />
      <meta property="og:type" content="website" />
      <meta property="og:description" content={description} />

      <meta property="og:image" content={Logo} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="960" />
      <meta property="og:image:height" content="960" />
      <meta property="og:image:alt" content="Perfsee Logo" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={Logo} />
    </ReactHelmet>
  )
}
