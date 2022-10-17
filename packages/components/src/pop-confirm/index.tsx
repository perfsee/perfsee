import { ExclamationCircleFilled } from '@ant-design/icons'
import { Callout, DirectionalHint } from '@fluentui/react'
import { memo, useCallback, useRef } from 'react'
import type { FC, ReactNode } from 'react'

import { useToggleState } from '../common'

import { Cancel, Confirm, Container, Header, Footer, Icon } from './style'

type PopConfirmProps = {
  title: string
  children?: ReactNode
  directionalHint?: DirectionalHint
  onCancel?: () => void
  onConfirm?: () => void
}

export const PopConfirm: FC<PopConfirmProps> = memo((props) => {
  const { children, title, directionalHint = DirectionalHint.topCenter, onCancel, onConfirm } = props
  const ref = useRef<HTMLDivElement | null>(null)
  const [calloutVisible, showCallout, hideCallout] = useToggleState(false)

  const onDismiss = useCallback(() => {
    hideCallout()
    onCancel?.()
  }, [hideCallout, onCancel])

  return (
    <>
      <div ref={ref} onClick={showCallout}>
        {children}
      </div>
      {calloutVisible && (
        <Callout target={ref} directionalHint={directionalHint} onDismiss={onDismiss}>
          <Container>
            <Header>
              <Icon>
                <ExclamationCircleFilled />
              </Icon>
              <span>{title}</span>
            </Header>
            <Footer>
              <Cancel onClick={onDismiss}>No</Cancel>
              <Confirm onClick={onConfirm}>Yes</Confirm>
            </Footer>
          </Container>
        </Callout>
      )}
    </>
  )
})
