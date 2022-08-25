import {
  ReactNode,
  useCallback,
  useState,
  CSSProperties,
  isValidElement,
  memo,
  useMemo,
  FunctionComponent,
  MouseEvent as ReactMouseEvent,
} from 'react'

import { createStyle, useDomEvent } from './utils'

interface ISplitViewProps {
  className?: string
  style?: CSSProperties
  children: (((width: number, height: number) => ReactNode) | ReactNode)[]
  size: number[]
  onSizeChange?: (size: number[]) => void
  width: number
  height: number
  grow: number[]
  minSize: number[]
  direction?: 'row' | 'column'
}

const styles = createStyle({
  splitView: {
    position: 'relative',
    overflow: 'hidden',
  },
  sashContinter: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  sash: {
    position: 'absolute',
    pointerEvents: 'auto',
    touchAction: 'none',
    zIndex: 1,
  },
  sashVertical: {
    top: 0,
    width: 4,
    height: '100%',
    cursor: 'col-resize',
  },
  sashHorizontal: {
    left: 0,
    height: 4,
    width: '100%',
    cursor: 'row-resize',
  },
  viewContinter: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  view: {
    position: 'absolute',
  },
})

const SplitViewSash: FunctionComponent<{
  direction: 'row' | 'column'
  position: number
  id: number
  onMouseDown?: (index: number, e: ReactMouseEvent) => void
}> = ({ direction, position, id, onMouseDown }) => {
  const positionPropertyName = direction === 'row' ? 'left' : 'top'

  const handleMouseDown = useCallback(
    (e: ReactMouseEvent) => {
      typeof onMouseDown === 'function' && onMouseDown(id, e)
    },
    [id, onMouseDown],
  )

  return (
    <div
      style={{
        ...styles.sash,
        ...(direction === 'row' ? styles.sashVertical : styles.sashHorizontal),
        [positionPropertyName]: position,
      }}
      onMouseDown={handleMouseDown}
    />
  )
}

interface ISplitViewChildContinterProps {
  direction: 'row' | 'column'
  position: number
  width: number
  height: number
  enablePointerEvents: boolean
  children: ((width: number, height: number) => ReactNode) | ReactNode
}

const SplitViewChildContinter: React.FunctionComponent<ISplitViewChildContinterProps> = ({
  direction,
  position,
  width,
  height,
  children,
  enablePointerEvents,
}) => {
  const positionPropertyName = direction === 'row' ? 'left' : 'top'

  return (
    <div
      style={{
        ...styles.viewContinter,
        ...styles.view,
        left: 0,
        top: 0,
        [positionPropertyName]: position,
        width,
        height,
        pointerEvents: !enablePointerEvents ? 'none' : 'auto',
      }}
      draggable={false}
    >
      {isValidElement(children)
        ? children
        : typeof children === 'function'
        ? (children as any)(width, height)
        : children}
    </div>
  )
}

const SplitView: React.FunctionComponent<ISplitViewProps> = memo(
  ({ className, style, size, onSizeChange, children, width, height, grow, minSize, direction = 'row' }) => {
    const length = size.length

    const [activeSashIndex, setActiveSashIndex] = useState<number>()
    const [startPosition, setStartPosition] = useState<{ x: number; y: number }>()
    const [startSize, setStartSize] = useState<number[]>()

    const finalSize = useMemo(() => {
      const minSizeTotal = minSize.reduce((pre, value) => pre + value, 0)
      const targetSizeTotal = Math.max(direction === 'row' ? width : height, minSizeTotal)
      const sizeOffsetTotal = targetSizeTotal - size.reduce((pre, value) => pre + value, 0)
      if (sizeOffsetTotal !== 0) {
        const growTotal = grow.reduce((pre, value) => pre + value, 0)
        const growOffset = grow.map((grow) => {
          return growTotal !== 0 ? (grow / growTotal) * sizeOffsetTotal : 0
        })
        const newSize = size.map((size, index) => {
          return Math.max(size + growOffset[index], minSize[index])
        })
        const newSizeTotal = newSize.reduce((pre, value) => pre + value, 0)

        let remainingSize = targetSizeTotal - newSizeTotal
        for (let i = newSize.length - 1; i >= 0; i--) {
          const tmp = Math.max(minSize[i], newSize[i] + remainingSize)
          remainingSize -= tmp - newSize[i]
          newSize[i] = tmp
        }
        return newSize
      }
      return [...size]
    }, [direction, grow, width, height, minSize, size])

    const handleSashMouseDown = useCallback(
      (index: number, e: ReactMouseEvent) => {
        setActiveSashIndex(index)
        setStartPosition({
          x: e.clientX,
          y: e.clientY,
        })
        setStartSize([...finalSize])
      },
      [finalSize],
    )

    const handleSashMouseUp = useCallback(() => {
      if (typeof activeSashIndex !== 'undefined') setActiveSashIndex(undefined)
    }, [activeSashIndex])
    useDomEvent(window, 'mouseup', handleSashMouseUp)

    const handleSashMouseMove = useCallback(
      (e: MouseEvent) => {
        if (typeof activeSashIndex !== 'undefined' && startPosition && startSize) {
          let offset = direction === 'row' ? e.clientX - startPosition.x : e.clientY - startPosition.y

          const newSize = [...startSize]

          if (offset > 0) {
            offset =
              startSize[activeSashIndex + 1] -
              Math.max(minSize[activeSashIndex + 1], startSize[activeSashIndex + 1] - offset)
          } else {
            offset =
              Math.max(minSize[activeSashIndex], startSize[activeSashIndex] + offset) - startSize[activeSashIndex]
          }
          newSize[activeSashIndex] = startSize[activeSashIndex] + offset
          newSize[activeSashIndex + 1] = startSize[activeSashIndex + 1] - offset

          if (typeof onSizeChange === 'function') onSizeChange(newSize)
        }
      },
      [activeSashIndex, startPosition, startSize, direction, onSizeChange, minSize],
    )
    useDomEvent(window, 'mousemove', handleSashMouseMove)

    const sashs = useMemo(() => {
      let offset = 0
      const sashs = []
      for (let i = 0; i < length - 1; i++) {
        offset += finalSize[i]
        const pos = offset - 2
        sashs.push(
          <SplitViewSash
            key={'sash-' + i}
            id={i}
            position={pos}
            direction={direction}
            onMouseDown={handleSashMouseDown}
          />,
        )
      }
      return sashs
    }, [direction, finalSize, handleSashMouseDown, length])

    let offset = 0
    const views = []
    for (let i = 0; i < length; i++) {
      const pos = offset
      views.push(
        <SplitViewChildContinter
          key={'view-' + i}
          position={pos}
          width={direction === 'row' ? finalSize[i] : width}
          height={direction === 'row' ? height : finalSize[i]}
          enablePointerEvents={typeof activeSashIndex === 'undefined'}
          direction={direction}
        >
          {children[i]}
        </SplitViewChildContinter>,
      )
      offset += finalSize[i]
    }

    return (
      <div className={className} style={{ ...styles.splitView, width, height, ...style }}>
        {typeof activeSashIndex !== 'undefined' && (
          <style>
            {`* {
              cursor: ${direction === 'row' ? 'col-resize' : 'row-resize'} !important;
              user-select: none !important;
            }`}
          </style>
        )}
        <div style={styles.sashContinter}>{sashs}</div>
        <div style={styles.viewContinter}>{views}</div>
      </div>
    )
  },
)

export default SplitView
