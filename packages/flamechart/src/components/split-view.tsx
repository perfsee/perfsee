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
  useLayoutEffect,
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
  shrink: number[]
  minSize: number[]
  maxSize: number[]
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
    zIndex: 2,
  },
  sashVertical: {
    top: 0,
    width: 8,
    height: '100%',
    cursor: 'col-resize',
  },
  sashHorizontal: {
    left: 0,
    height: 8,
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
  ({
    className,
    style,
    size,
    onSizeChange,
    children,
    width,
    height,
    grow,
    shrink,
    minSize,
    maxSize,
    direction = 'row',
  }) => {
    const length = size.length

    const [activeSashIndex, setActiveSashIndex] = useState<number>()
    const [startPosition, setStartPosition] = useState<{ x: number; y: number }>()
    const [startSize, setStartSize] = useState<number[]>()

    const finalSize = useMemo(() => {
      const minSizeTotal = minSize.reduce((pre, value) => pre + value, 0)
      const targetSizeTotal = Math.max(direction === 'row' ? width : height, minSizeTotal)
      let sizeOffsetTotal = targetSizeTotal - size.reduce((pre, value, i) => pre + Math.max(value, minSize[i]), 0)
      let repeatTime = 0
      if (sizeOffsetTotal >= 0) {
        let newSize = size
        while (sizeOffsetTotal > 0 && repeatTime++ < 5) {
          const newGrow = grow.map((grow, i) => (newSize[i] >= maxSize[i] ? 0 : grow))
          const growTotal = newGrow.reduce((pre, value) => pre + value, 0)
          const growOffset = newGrow.map((grow) => {
            return growTotal !== 0 ? (grow / growTotal) * sizeOffsetTotal : 0
          })
          newSize = newSize.map((size, index) => {
            return Math.min(size + growOffset[index], maxSize[index])
          })
          const newSizeTotal = newSize.reduce((pre, value) => pre + value, 0)
          sizeOffsetTotal = targetSizeTotal - newSizeTotal
        }
        return newSize
      } else {
        let newSize = size
        while (sizeOffsetTotal < 0 && repeatTime++ < 5) {
          const newShrink = shrink.map((shrink, i) => (newSize[i] <= minSize[i] ? 0 : shrink))
          const shrinkTotal = newShrink.reduce((pre, value) => pre + value, 0)
          const shrinkOffset = newShrink.map((shrink) => {
            return shrinkTotal !== 0 ? (shrink / shrinkTotal) * sizeOffsetTotal : 0
          })
          newSize = newSize.map((size, index) => {
            return Math.max(size + shrinkOffset[index], minSize[index])
          })
          const newSizeTotal = newSize.reduce((pre, value) => pre + value, 0)
          sizeOffsetTotal = targetSizeTotal - newSizeTotal
        }
        return newSize
      }
    }, [direction, grow, width, height, minSize, maxSize, size, shrink])

    // set initial split sizes for parent
    useLayoutEffect(() => {
      setTimeout(() => {
        onSizeChange?.(finalSize)
      }, 200)
      // eslint-disable-next-line
    }, [])

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
            for (let i = activeSashIndex + 1; i < newSize.length && Math.abs(offset) >= 1; i++) {
              const calcOffset = newSize[i] - Math.max(minSize[i], newSize[i] - offset)
              newSize[activeSashIndex] = newSize[activeSashIndex] + calcOffset
              newSize[i] = newSize[i] - calcOffset
              offset -= calcOffset
            }
          } else {
            for (let i = activeSashIndex; i >= 0 && Math.abs(offset) >= 1; i--) {
              const calcOffset = Math.max(minSize[i], newSize[i] + offset) - newSize[i]
              newSize[i] = newSize[i] + calcOffset
              newSize[activeSashIndex + 1] = newSize[activeSashIndex + 1] - calcOffset
              offset += calcOffset
            }
          }

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
