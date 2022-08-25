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

import { DirectionalHint, IButtonProps, IImageProps, TeachingBubble } from '@fluentui/react'
import { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { hasTeachingHistory, insertTeachingHistory } from './storage'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  teachingId?: string
  primaryButtonProps?: IButtonProps
  illustrationImage?: IImageProps
  headline?: string
  body?: React.ReactNode
  directional?: DirectionalHint
  visible?: boolean
  model?: boolean
  delay?: number
}

let teachingSequence = 0

export const TeachingBubbleHost: React.FC<Props> = ({
  children,
  teachingId,
  directional,
  primaryButtonProps,
  illustrationImage,
  headline,
  body,
  visible = true,
  model = false,
  delay = 0,
  ...other
}) => {
  const teachingIndex = useRef(teachingSequence++)

  const divId = other.id ? other.id : `teaching-bubble-${teachingIndex.current}`

  const [innerVisible, setInnerVisible] = useState(false)
  const [isFinished, setIsFinish] = useState(false)

  const handleDismiss = useCallback(() => {
    if (visible && (innerVisible || model)) {
      setInnerVisible(false)
      setIsFinish(true)
      if (teachingId) {
        insertTeachingHistory(teachingId)
      }
    }
  }, [innerVisible, model, teachingId, visible])

  useEffect(() => {
    if (visible && !innerVisible && !isFinished && !(teachingId != null && hasTeachingHistory(teachingId))) {
      const timer = setTimeout(() => {
        setInnerVisible(true)
      }, delay)
      return () => {
        clearTimeout(timer)
      }
    }
  }, [delay, isFinished, innerVisible, visible, teachingId])

  const primaryButton = useMemo(
    () => primaryButtonProps ?? { text: 'Got it', onClick: handleDismiss },
    [handleDismiss, primaryButtonProps],
  )

  const calloutProps = useMemo(
    () => ({
      directionalHint: directional ?? DirectionalHint.rightTopEdge,
    }),
    [directional],
  )

  return (
    <div id={divId} onClick={handleDismiss} {...other}>
      {children}
      {visible && (innerVisible || model) && (
        <TeachingBubble
          illustrationImage={illustrationImage}
          calloutProps={calloutProps}
          target={`#${divId}`}
          hasCloseButton={false}
          closeButtonAriaLabel="Close"
          primaryButtonProps={primaryButton}
          onDismiss={handleDismiss}
          headline={headline}
        >
          {body}
        </TeachingBubble>
      )}
    </div>
  )
}

export function useTeachingSerials(
  teachingId: string,
  initSerials: Exclude<Props, 'teachingId' | 'visible' | 'model' | 'primaryButtonProps'>[],
  option: { delay?: number; visible?: boolean } = {},
) {
  const { delay = 0, visible = true } = option
  const serialsRef = useRef(initSerials)
  const serials = serialsRef.current
  const [step, setStep] = useState(-1)
  const childSetVisibleRef = useRef<(((visible: boolean) => void) | null)[]>([])

  // build bubbles components
  const bubbles = useMemo(() => {
    return serialsRef.current.map((v, index, serials) => {
      return (({ children }) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [visible, setVisible] = useState(false)
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          childSetVisibleRef.current[index] = setVisible
          return () => {
            childSetVisibleRef.current[index] = null
          }
        }, [])
        const isFinal = index === serials.length - 1
        return (
          <TeachingBubbleHost
            visible={visible}
            primaryButtonProps={{
              text: isFinal ? 'Got it' : 'Next',
              onClick: () => {
                setStep(index + 1)
              },
            }}
            model
            {...v}
          >
            {children}
          </TeachingBubbleHost>
        )
      }) as React.FC<PropsWithChildren<any>>
    })
  }, [])

  // start up
  useEffect(() => {
    if (step === -1 && visible && !hasTeachingHistory(teachingId)) {
      const timer = setTimeout(() => {
        setStep(0)
      }, delay)
      return () => {
        clearTimeout(timer)
      }
    }
  }, [delay, step, teachingId, visible])

  // end
  useEffect(() => {
    if (step === serials.length) {
      insertTeachingHistory(teachingId)
    }
  }, [step, serials.length, teachingId])

  // update children visible
  useEffect(() => {
    childSetVisibleRef.current.forEach((setVisible, index) => {
      if (typeof setVisible === 'function') {
        setVisible(index === step)
      }
    })
  }, [step])

  // skips the specified step, calls when the user completes the operation
  const skipStep = useCallback((currentStep: number) => {
    setStep((step) => {
      if (step === currentStep) {
        return step + 1
      } else {
        return step
      }
    })
  }, [])

  return { bubbles, skipStep }
}
