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

import { parse, stringify } from 'query-string'

type AdjustImgSizeOption = {
  size?: number
  width?: number
  height?: number
}

const SIZE_FIELD = 'image_size'
const DEFAULT_SIZE_VALUE = 'noop'

export const adjustOSSImgSize = (url: string, options: AdjustImgSizeOption = {}) => {
  if (!url || !url.trim()) {
    return url
  }

  try {
    const _url = new URL(url)
    const pattern = parse(_url.search)

    const { size, width, height } = options

    let value = DEFAULT_SIZE_VALUE

    if (size || (width && height)) {
      const _w = width ?? size ?? 0
      const _h = height ?? size ?? 0

      const ratio = window.devicePixelRatio ?? 1

      const realWidth = Math.ceil(_w * ratio)
      const realHeight = Math.ceil(_h * ratio)

      value = `${realWidth}x${realHeight}`
    }

    pattern[SIZE_FIELD] = value
    _url.search = stringify(pattern)

    return _url.toString()
  } catch {
    return url
  }
}
