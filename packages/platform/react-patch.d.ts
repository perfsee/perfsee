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

// temporary workaround for fluentui to adapt @types/react@v18
// remove after https://github.com/microsoft/fluentui/pull/22891 merged
import React from 'react'

declare global {
  namespace React {
    /**
     * @deprecated use React.PropsWithChildren
     */
    interface Props<T> {
      children?: ReactNode | undefined
      key?: Key | undefined
      ref?: LegacyRef<T> | undefined
    }
  }
}
