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

import { PlayCircleFilled } from '@ant-design/icons'
import { Modal } from '@fluentui/react'
import { FC, memo, createRef, useState, useCallback } from 'react'

import { useToggleState } from '@perfsee/components'
import { formatTime } from '@perfsee/shared'

import { VideoButton, VideoTime, VideoContainer } from './style'

type VideoProps = {
  video?: string
  cover?: string // base64
}

export const SnapshotVideo: FC<VideoProps> = memo(({ video, cover }) => {
  const videoRef = createRef<HTMLVideoElement>()
  const [videoTime, setVideoTime] = useState<number>(0)
  const [visible, show, hide] = useToggleState(false)

  const onTimeUpdate = useCallback(() => {
    const time = videoRef.current?.currentTime
    if (time) {
      setVideoTime(time)
    }
  }, [videoRef])

  const formatted = formatTime(videoTime * 1000)

  return (
    <>
      <VideoContainer>
        <img src={cover} />
        {video ? (
          <VideoButton onClick={show}>
            <PlayCircleFilled style={{ fontSize: '2.5rem' }} />
          </VideoButton>
        ) : null}
      </VideoContainer>
      <Modal
        isOpen={visible}
        onDismiss={hide}
        styles={{ main: { minWidth: 'auto' }, scrollableContent: { display: 'flex' } }}
      >
        <video
          ref={videoRef}
          onTimeUpdate={onTimeUpdate}
          controls
          src={video}
          style={{ cursor: 'pointer', height: '62vh' }}
          autoPlay={visible}
        />
        <VideoTime>
          {formatted.value}
          {formatted.unit}
        </VideoTime>
      </Modal>
    </>
  )
})
