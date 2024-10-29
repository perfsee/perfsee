import { CSSProperties, RefObject, useEffect, useRef, useState } from 'react'

import { objectsHaveShallowEquality } from '../lib/utils'

type PartialClientRect = Omit<ClientRect, 'toJSON' | 'x' | 'y'>

/**
 * A hook to get the size of an element and its client rect.
 *
 * @argument element The RefObject of target element.
 * @argument deps When the value in the list changes, the size is recalculated
 *
 * @example
 * const elementRef = useRef(null);
 * const {width=100, height=100, clientRect} = useSize(elementRef)
 *
 */
export function useElementSize(element: RefObject<HTMLElement> | HTMLElement | Window) {
  const [clientRect, setClientRect] = useState<PartialClientRect | null>(null)
  const clientRectRef = useRef<PartialClientRect | null>(null)
  useEffect(() => {
    function update() {
      let newClientRect: PartialClientRect
      if (element === window) {
        newClientRect = {
          bottom: window.innerHeight,
          height: window.innerHeight,
          left: 0,
          right: window.innerWidth,
          top: 0,
          width: window.innerWidth,
        }
      } else {
        const htmlElement = (('current' in element ? element.current : element) as HTMLElement) || document.body
        const c = htmlElement.getClientRects()[0]
        newClientRect = {
          bottom: c.bottom,
          height: c.height,
          left: c.left,
          right: c.right,
          top: c.top,
          width: c.width,
        }
      }

      if (!objectsHaveShallowEquality(newClientRect, clientRectRef.current)) {
        setClientRect(newClientRect)
        clientRectRef.current = newClientRect
      }
    }
    const ob = new ResizeObserver(update)
    //@ts-expect-error
    ob.observe(element.current || element)
    window.addEventListener('resize', update)
    setTimeout(update)
    return () => {
      window.removeEventListener('resize', update)
      ob.disconnect()
    }
  }, [element])

  return { width: clientRect?.width, height: clientRect?.height, clientRect }
}

export function useDomEvent<K extends keyof HTMLElementEventMap>(
  element: RefObject<HTMLElement> | HTMLElement | Window,
  event: K,
  callback: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
) {
  const htmlElement = 'current' in element ? element.current : element
  useEffect(() => {
    htmlElement?.addEventListener(event, callback as EventListenerOrEventListenerObject)
    return () => htmlElement?.removeEventListener(event, callback as EventListenerOrEventListenerObject)
  }, [htmlElement, event, callback])
}

/* for typescript */
export function createStyle<S extends { [key: string]: CSSProperties }>(style: S): S {
  return style
}
