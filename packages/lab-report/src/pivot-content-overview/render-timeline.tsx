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

import { css, useTheme } from '@emotion/react'
import { Stack, Modal } from '@fluentui/react'
import { FC, MouseEvent, useCallback, useState } from 'react'

import { useToggleState } from '@perfsee/components'
import { TimelineSchema, formatTime } from '@perfsee/shared'

import { TimelineCell } from './style'

type Props = {
  timelines: TimelineSchema[]
}

export const RenderTimeline: FC<Props> = ({ timelines }) => {
  const theme = useTheme()
  const [visible, show, hide] = useToggleState(false)
  const [shownIndex, setShown] = useState<number | null>(null)

  const onShow = useCallback(
    (e: MouseEvent<HTMLImageElement>) => {
      const index = (e.target as HTMLImageElement)?.dataset?.['index']
      if (index) {
        setShown(Number(index))
      }
      show()
    },
    [show],
  )

  return (
    <Stack horizontal tokens={{ childrenGap: '8px' }} wrap>
      {timelines.map((timeline, i) => {
        const { value, unit } = formatTime(timeline.timing)
        return (
          <TimelineCell key={timeline.timing}>
            <div css={css({ color: theme.text.colorSecondary })}>
              <span>{value}</span>
              <span css={css({ fontSize: '12px', marginLeft: '5px' })}>{unit}</span>
            </div>
            <img
              css={css({ marginTop: '10px', border: `solid 1px ${theme.border.color}`, cursor: 'zoom-in' })}
              width={110}
              src={timeline.data}
              alt="Snapshot"
              data-index={i}
              onClick={onShow}
            />
          </TimelineCell>
        )
      })}
      <Modal
        isOpen={visible}
        onDismiss={hide}
        styles={{ main: { minWidth: 'auto' }, scrollableContent: { display: 'flex' } }}
      >
        <img src={timelines[shownIndex || 0]?.data} style={{ height: '62vh' }} />
      </Modal>
    </Stack>
  )
}
