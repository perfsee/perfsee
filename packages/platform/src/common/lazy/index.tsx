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

import { lazy as reactLazy, ComponentType, ComponentPropsWithRef, Suspense } from 'react'

export function lazy<T extends ComponentType<any>>(factory: () => Promise<Record<any, T>>) {
  const LazyComponent = reactLazy(() =>
    factory().then((mod) => {
      if ('default' in mod) {
        return { default: mod.default }
      } else {
        const components = Object.values(mod)
        if (components.length > 1) {
          console.warn('Lazy loaded module has more then one exports')
        }
        return {
          default: components[0],
        }
      }
    }),
  )

  return (props: ComponentPropsWithRef<T>) => {
    return (
      <Suspense fallback={false}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}
