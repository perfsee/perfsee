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

import { Size } from '../types'

export function addSize(size1: Size, size2: Size): Size {
  return {
    raw: size1.raw + size2.raw,
    gzip: size1.gzip + size2.gzip,
    brotli: size1.brotli + size2.brotli,
  }
}

export function getDefaultSize(): Size {
  return {
    raw: 0,
    gzip: 0,
    brotli: 0,
  }
}
