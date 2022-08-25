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

import styled from '@emotion/styled'
import { MouseEventHandler, useCallback, useEffect, useState } from 'react'

import { SharedColors } from '@perfsee/dls'
import { TimelineSchema } from '@perfsee/shared'

import { SnapshotUserFlowDetailType } from '../../../snapshot-type'

interface Props {
  steps: SnapshotUserFlowDetailType[]
  currentStepIndex: number
  onStepClick: (stepIndex: number) => void
}

const SecondaryTitle = styled.div({
  fontSize: '13px',
  fontWeight: 300,
})

const PrimaryTitle = styled.div({
  fontSize: '16px',
  fontWeight: 500,
})

const Line = styled.div({
  width: '100%',
  height: '2px',
  backgroundColor: SharedColors.blue10,
})

const Container = styled.div({
  display: 'grid',
  gridTemplateAreas: `
    ". . . current-tn . . ."
    "prev-seg prev-tn prev-tn current-tn next-tn next-tn next-seg"
    ". prev-title . current-tn . next-title ."
    ". prev-title current-title current-title current-title next-title ."`,
  gridTemplateRows: '1fr auto 1fr auto',
  gridTemplateColumns: '100px minmax(20ch, 1fr) auto auto auto minmax(20ch, 1fr) 100px',
  alignItems: 'center',
  margin: '16px 0px',
})

const PrevThumbnailContainer = styled.div({
  display: 'flex',
  alignItems: 'center',
  gridArea: 'prev-tn',
})

const PrevTitle = styled(SecondaryTitle)({
  gridArea: 'prev-title',
  textAlign: 'left',
  justifySelf: 'start',
  alignSelf: 'start',
  marginTop: '16px',
  cursor: 'pointer',
})

const CenterThumbnailContainer = styled.div({
  display: 'flex',
  alignItems: 'center',
  gridArea: 'current-tn',
})

const CenterTitle = styled(PrimaryTitle)({
  gridArea: 'current-title',
  textAlign: 'center',
  margin: '16px 4px 0',
})

const NextThumbnailContainer = styled.div({
  display: 'flex',
  alignItems: 'center',
  gridArea: 'next-tn',
})

const NextTitle = styled(SecondaryTitle)({
  gridArea: 'next-title',
  textAlign: 'right',
  justifySelf: 'end',
  alignSelf: 'start',
  marginTop: '16px',
  cursor: 'pointer',
})

const PrevSegment = styled.div({
  gridArea: 'prev-seg',
})

const NextSegment = styled.div({
  gridArea: 'next-seg',
})

const Label = styled.div({
  fontSize: '0.8em',
  color: SharedColors.gray30,
})

export const UserFlowNavigation = ({ steps, currentStepIndex, onStepClick }: Props) => {
  const currentStep = steps[currentStepIndex]
  const prevPrevStep = steps[currentStepIndex - 2]
  const prevStep = steps[currentStepIndex - 1]
  const nextStep = steps[currentStepIndex + 1]
  const nextNextStep = steps[currentStepIndex + 2]
  const stepCount = steps.length

  const clickPrevStep = useCallback(() => {
    onStepClick(currentStepIndex - 1)
  }, [currentStepIndex, onStepClick])

  const clickNextStep = useCallback(() => {
    onStepClick(currentStepIndex + 1)
  }, [currentStepIndex, onStepClick])

  return (
    <Container>
      {prevPrevStep && (
        <PrevSegment>
          <Line />
        </PrevSegment>
      )}
      {prevStep && (
        <PrevThumbnailContainer>
          <Thumbnails onClick={clickPrevStep} timeline={prevStep?.timelines ?? []} maxSize={100} />
          <Line />
        </PrevThumbnailContainer>
      )}
      {prevStep && (
        <PrevTitle>
          <SecondaryTitle>{prevStep.stepName}</SecondaryTitle>
        </PrevTitle>
      )}
      {currentStep && (
        <CenterThumbnailContainer>
          <Thumbnails timeline={currentStep?.timelines ?? []} maxSize={150} />
        </CenterThumbnailContainer>
      )}
      {currentStep && (
        <CenterTitle>
          <>{currentStep.stepName}</>
          <Label>{currentStep.stepUrl}</Label>
          <Label>
            ({currentStepIndex + 1}/{stepCount})
          </Label>
        </CenterTitle>
      )}
      {nextStep && (
        <NextThumbnailContainer>
          <Line />
          <Thumbnails onClick={clickNextStep} timeline={nextStep?.timelines ?? []} maxSize={100} />
        </NextThumbnailContainer>
      )}
      {nextStep && (
        <NextTitle onClick={clickNextStep}>
          <SecondaryTitle>{nextStep.stepName}</SecondaryTitle>
        </NextTitle>
      )}
      {nextNextStep && (
        <NextSegment>
          <Line />
        </NextSegment>
      )}
    </Container>
  )
}

const ThumbnailsImage = styled.img({
  padding: '4px',
  border: '2px solid ' + SharedColors.blue10,
  borderRadius: '4px',
  boxSizing: 'content-box',
  userSelect: 'none',
})

const Thumbnails = ({
  timeline,
  maxSize,
  onClick,
}: {
  timeline: TimelineSchema[]
  maxSize: number
  onClick?: MouseEventHandler
}) => {
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  const [frameNum, setFrameNum] = useState(0)

  const firstImage = timeline[0]?.data
  const currentImage = timeline[frameNum % timeline.length]?.data

  useEffect(() => {
    const img = new Image()
    img.src = firstImage
    img.onload = () => {
      const isPortrait = img.height > img.width
      const height = isPortrait ? maxSize : maxSize * (img.height / img.width)
      const width = isPortrait ? maxSize * (img.width / img.height) : maxSize
      setSize({ width, height })
    }
    return () => {
      img.onload = null
    }
  }, [firstImage, maxSize])

  useEffect(() => {
    const interval = setInterval(() => setFrameNum((v) => v + 1), 200)
    return () => clearInterval(interval)
  }, [])

  return <ThumbnailsImage src={currentImage} width={size.width} height={size.height} onClick={onClick} />
}
