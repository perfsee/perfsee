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
import { SharedColors } from '@fluentui/theme'
import { useRef, useLayoutEffect, useEffect, FC, PropsWithChildren } from 'react'
import { createPortal } from 'react-dom'

const Container = styled.div({
  position: 'fixed',
  left: 0,
  top: 0,
  background: '#fff',
  padding: '12px',
  borderRadius: '4px',
  lineHeight: 1.6,
  border: '1px solid ' + SharedColors.gray10,
  color: SharedColors.gray20,
  zIndex: 999999,
  willChange: 'left, top',
})

const ScrollArea = styled.div({
  maxHeight: '190px',
  maxWidth: '380px',
  overflow: 'auto',
})

interface Props {
  targetClientRect: {
    left: number
    top: number
    width: number
    height: number
  }
  onMouseEnter: React.MouseEventHandler<HTMLElement>
  onMouseLeave: React.MouseEventHandler<HTMLElement>
}

export const TreeMapTooltipContainer: FC<PropsWithChildren<Props>> = ({
  targetClientRect,
  onMouseEnter,
  onMouseLeave,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const handleWheel = (e: WheelEvent) => {
      // disable browser zoom in/zoom out
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
      }
    }

    element.addEventListener('wheel', handleWheel)
    return () => element.removeEventListener('wheel', handleWheel)
  }, [])

  useLayoutEffect(() => {
    if (containerRef.current) {
      const tooltipWidth = containerRef.current.offsetWidth
      const tooltipHeight = containerRef.current.offsetHeight
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight

      let top = targetClientRect.top - tooltipHeight
      if (top < 0) {
        top = targetClientRect.top + targetClientRect.height
      }

      if (top + tooltipHeight > windowHeight) {
        top = windowHeight - tooltipHeight
      }

      if (top < 0) {
        top = 0
      }

      let left = targetClientRect.left + targetClientRect.width / 2 - tooltipWidth / 2
      if (left < 0) {
        left = 0
      }

      if (left + tooltipWidth > windowWidth) {
        left = windowWidth - tooltipWidth
      }
      containerRef.current.style.left = left + 'px'
      containerRef.current.style.top = top + 'px'
    }
  })

  return createPortal(
    <Container ref={containerRef} style={{ left: 0, top: 0 }} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <ScrollArea>{children}</ScrollArea>
    </Container>,
    document.body,
  )
}
