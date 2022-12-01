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

import { Nav, INavProps } from '@fluentui/react'
import { merge } from 'lodash'

export function SecondaryNav(props: INavProps) {
  return (
    <Nav
      {...props}
      styles={merge(
        {
          root: { minWidth: '240px', marginRight: '16px' },
          link: { paddingLeft: '10px', paddingRight: '20px' },
          groupContent: { marginBottom: 0 },
          linkText: { margin: '0 4px' },
        },
        props.styles,
      )}
    />
  )
}
