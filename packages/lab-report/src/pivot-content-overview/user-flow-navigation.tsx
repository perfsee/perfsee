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

import { NeutralColors, SharedColors } from '@perfsee/dls'
import { TimelineSchema } from '@perfsee/shared'

import { SnapshotUserFlowDetailType } from '../snapshot-type'

interface Props {
  steps: SnapshotUserFlowDetailType[]
  currentStepIndex: number
  onStepClick: (stepIndex: number, reportId: number) => void
}

const SecondaryTitle = styled.div({
  fontSize: '13px',
  fontWeight: 300,
  overflow: 'hidden',
  'text-overflow': 'ellipsis',
  'max-width': 300,
  lineBreak: 'anywhere',

  '> span': {
    display: '-webkit-box',
    '-webkit-box-orient': 'vertical',
    '-webkit-line-clamp': '2',
    overflow: 'hidden',
  },
})

const PrimaryTitle = styled.div({
  fontSize: '16px',
  fontWeight: 500,
  overflow: 'hidden',
  'text-overflow': 'ellipsis',
  'max-width': 500,
  lineBreak: 'anywhere',

  '> span': {
    display: '-webkit-box',
    '-webkit-box-orient': 'vertical',
    '-webkit-line-clamp': '2',
    overflow: 'hidden',
  },
})

const Line = styled.div({
  width: '100%',
  height: '2px',
  backgroundColor: NeutralColors.gray50,
})

const Container = styled.div({
  display: 'grid',
  gridTemplateAreas: `
    ". . . . . current-tn . . . . ."
    "prev-seg prepre-tn prepre-tn prev-tn prev-tn current-tn next-tn next-tn nextnext-tn nextnext-tn next-seg"
    ". prepre-title . prev-title . current-tn . next-title . nextnext-title ."
    ". . . prev-title current-title current-title current-title next-title . . ."`,
  gridTemplateRows: '1fr auto 1fr auto',
  gridTemplateColumns:
    '100px minmax(20ch, 1fr) auto minmax(20ch, 1fr) auto auto auto minmax(20ch, 1fr) auto minmax(20ch, 1fr) 100px',
  alignItems: 'center',
  margin: '8px 0px',
})

const PrevPrevThumbnailContainer = styled.div({
  display: 'flex',
  alignItems: 'center',
  gridArea: 'prepre-tn',
})

const PrevPrevTitle = styled(SecondaryTitle)({
  gridArea: 'prepre-title',
  textAlign: 'left',
  justifySelf: 'start',
  alignSelf: 'start',
  marginTop: '16px',
  cursor: 'pointer',
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
  marginTop: -20,
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

const NextNextThumbnailContainer = styled.div({
  display: 'flex',
  alignItems: 'center',
  gridArea: 'nextnext-tn',
})

const NextNextTitle = styled(SecondaryTitle)({
  gridArea: 'nextnext-title',
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
  const prevPrevPrevStep = steps[currentStepIndex - 3]
  const prevStep = steps[currentStepIndex - 1]
  const nextStep = steps[currentStepIndex + 1]
  const nextNextStep = steps[currentStepIndex + 2]
  const nextNextNextStep = steps[currentStepIndex + 3]
  const stepCount = steps.length

  const clickPrevStep = useCallback(() => {
    onStepClick(currentStepIndex - 1, prevStep?.reportId)
  }, [currentStepIndex, onStepClick, prevStep?.reportId])

  const clickNextStep = useCallback(() => {
    onStepClick(currentStepIndex + 1, nextStep?.reportId)
  }, [currentStepIndex, onStepClick, nextStep?.reportId])

  const clickPrevPrevStep = useCallback(() => {
    onStepClick(currentStepIndex - 2, prevPrevStep?.reportId)
  }, [currentStepIndex, onStepClick, prevPrevStep?.reportId])

  const clickNextNextStep = useCallback(() => {
    onStepClick(currentStepIndex + 2, nextNextStep?.reportId)
  }, [currentStepIndex, onStepClick, nextNextStep?.reportId])

  return (
    <Container>
      {prevPrevPrevStep && (
        <PrevSegment>
          <Line />
        </PrevSegment>
      )}
      {prevPrevStep && (
        <PrevPrevThumbnailContainer>
          <Thumbnails onClick={clickPrevPrevStep} timeline={prevPrevStep?.timelines ?? []} maxSize={100} />
          <Line />
        </PrevPrevThumbnailContainer>
      )}
      {prevPrevStep && (
        <PrevPrevTitle onClick={clickPrevPrevStep}>
          <SecondaryTitle>
            <span>{prevPrevStep.stepName}</span>
            <Label>
              ({currentStepIndex - 1}/{stepCount})
            </Label>
          </SecondaryTitle>
        </PrevPrevTitle>
      )}
      {prevStep && (
        <PrevThumbnailContainer>
          <Thumbnails onClick={clickPrevStep} timeline={prevStep?.timelines ?? []} maxSize={100} />
          <Line />
        </PrevThumbnailContainer>
      )}
      {prevStep && (
        <PrevTitle>
          <SecondaryTitle>
            <span>{prevStep.stepName}</span>
            <Label>
              ({currentStepIndex}/{stepCount})
            </Label>
          </SecondaryTitle>
        </PrevTitle>
      )}
      {currentStep && (
        <CenterThumbnailContainer>
          <Thumbnails timeline={currentStep?.timelines ?? []} maxSize={150} current />
        </CenterThumbnailContainer>
      )}
      {currentStep && (
        <CenterTitle>
          <span>{currentStep.stepName}</span>
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
          <SecondaryTitle>
            <span>{nextStep.stepName}</span>
            <Label>
              ({currentStepIndex + 2}/{stepCount})
            </Label>
          </SecondaryTitle>
        </NextTitle>
      )}
      {nextNextStep && (
        <NextNextThumbnailContainer>
          <Line />
          <Thumbnails onClick={clickNextNextStep} timeline={nextNextStep?.timelines ?? []} maxSize={100} />
        </NextNextThumbnailContainer>
      )}
      {nextNextStep && (
        <NextNextTitle onClick={clickNextNextStep}>
          <SecondaryTitle>
            <span>{nextNextStep.stepName}</span>
            <Label>
              ({currentStepIndex + 3}/{stepCount})
            </Label>
          </SecondaryTitle>
        </NextNextTitle>
      )}
      {nextNextNextStep && (
        <NextSegment>
          <Line />
        </NextSegment>
      )}
    </Container>
  )
}

const ThumbnailsImage = styled.img(({ current }: { current?: boolean }) => ({
  padding: '4px',
  border: '2px solid ' + (current ? SharedColors.blue10 : NeutralColors.gray50),
  borderRadius: '4px',
  boxSizing: 'content-box',
  userSelect: 'none',
  cursor: 'pointer',
}))

const Thumbnails = ({
  timeline,
  maxSize,
  onClick,
  current,
}: {
  timeline: TimelineSchema[]
  maxSize: number
  current?: boolean
  onClick?: MouseEventHandler
}) => {
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 100, height: 50 })
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

  return (
    <ThumbnailsImage src={currentImage} width={size.width} height={size.height} onClick={onClick} current={current} />
  )
}
