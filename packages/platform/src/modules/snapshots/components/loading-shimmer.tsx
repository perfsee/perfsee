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

import { css } from '@emotion/react'
import { Shimmer } from '@fluentui/react'
import { range } from 'lodash'

import { BodyPadding } from '@perfsee/components'

export const LoadingShimmer = () => {
  return (
    <BodyPadding css={css({ '.ms-Shimmer-container': { margin: '10px 0' } })}>
      <Shimmer />
      <Shimmer />
      <Shimmer />
      <Shimmer />
      <Shimmer />
      <div css={css({ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' })}>
        <div>
          {range(8).map((i) => (
            <Shimmer width="calc(80vw - 380px)" height="15px" key={`shimmer-width-450-${i}`} />
          ))}
          <Shimmer width="100px" height="16px" />
        </div>
        <div css={css({ '.ms-Shimmer-container': { margin: 'unset' } })}>
          {range(14).map((i) => (
            <Shimmer width="380px" height="16px" key={`shimmer-width-500-${i}`} />
          ))}
        </div>
      </div>
      {range(12).map((i) => (
        <Shimmer key={`shimmer-default-${i}`} />
      ))}
    </BodyPadding>
  )
}

export const ListShimmer = ({ size }: { size: number }) => {
  return (
    <BodyPadding css={css({ '.ms-Shimmer-container': { margin: '10px 0' } })}>
      {range(size).map((i) => (
        <div
          key={`shimmer-width-450-${i}`}
          height="50px"
          css={css({ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' })}
        >
          <div>
            <Shimmer width="200px" />
            <Shimmer width="500px" />
          </div>
          <Shimmer width="100px" key={`shimmer-default-${i}`} />
        </div>
      ))}
    </BodyPadding>
  )
}
