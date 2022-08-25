import { useLayoutEffect, useRef, FC, PropsWithChildren } from 'react'
import { createPortal } from 'react-dom'

import { Color } from '../lib/color'
import { Vec2 } from '../lib/math'
import { Theme } from '../themes/theme'

interface HovertipProps {
  offset?: Vec2
  theme: Theme
}

const TOOLTIP_WIDTH_MAX = 800
const HOVERTIP_PADDING = 8
const FONT_SIZE_LABEL = 13

export const Hovertip: FC<PropsWithChildren<HovertipProps>> = ({ offset, children, theme }) => {
  const divRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (divRef.current) {
      if (!children || !offset) {
        return
      }

      const width = document.body.offsetWidth
      const height = window.innerHeight
      const rect = divRef.current.getBoundingClientRect()

      const translate = { x: 0, y: 0 }

      const OFFSET_FROM_MOUSE = 7
      if (offset.x + OFFSET_FROM_MOUSE + rect.width < width) {
        translate.x = offset.x + OFFSET_FROM_MOUSE
      } else {
        translate.x = width - rect.width
      }

      if (offset.y + OFFSET_FROM_MOUSE + rect.height < height) {
        translate.y = offset.y + OFFSET_FROM_MOUSE
      } else {
        translate.y = height - rect.height
      }

      const target = divRef.current

      requestAnimationFrame(() => {
        target.style.transform = `translate(${translate.x}px, ${translate.y}px)`
        target.style.opacity = '1'
      })
    }
  }, [offset, children])

  return createPortal(
    <div
      ref={divRef}
      style={{
        display: !children ? 'none' : 'block',
        position: 'fixed',
        left: '0',
        top: '0',
        opacity: '0',
        color: theme.fgPrimaryColor,
        background: Color.fromCSSHex(theme.bgPrimaryColor).withAlpha(1).toCSS(),
        maxWidth: TOOLTIP_WIDTH_MAX,
        paddingTop: HOVERTIP_PADDING,
        paddingBottom: HOVERTIP_PADDING,
        pointerEvents: 'none',
        userSelect: 'none',
        fontSize: FONT_SIZE_LABEL,
        fontFamily: theme.fontFamily,
        zIndex: 2,
        boxShadow: 'rgba(0, 0, 0, 0.12) 0px 1px 6px, rgba(0, 0, 0, 0.12) 0px 1px 4px',
      }}
    >
      <div
        style={{
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          overflowX: 'hidden',
          paddingLeft: HOVERTIP_PADDING,
          paddingRight: HOVERTIP_PADDING,
          maxWidth: TOOLTIP_WIDTH_MAX,
        }}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
