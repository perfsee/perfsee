import { CSSProperties, FunctionComponent, memo, MouseEventHandler, useCallback } from 'react'

import { Flamechart, FlamechartFrame } from '../lib/flamechart'
import { Frame } from '../lib/profile'
import { Theme } from '../themes/theme'

const FONT_SIZE = 12

interface ColorChitProps {
  color: string
}

export const ColorChit = memo((props: ColorChitProps) => {
  return (
    <span
      style={{
        position: 'relative',
        top: -1,
        display: 'inline-block',
        verticalAlign: 'middle',
        marginRight: '0.5em',
        border: `1px solid hsl(0deg 0% 50% / 20%)`,
        width: FONT_SIZE - 2,
        height: FONT_SIZE - 2,
        backgroundColor: props.color,
      }}
    />
  )
})

export const GoToFile = memo(({ theme, onClick }: { theme: Theme; onClick: MouseEventHandler }) => {
  return (
    <a style={{ marginLeft: '0.5em' }} title="Go To File" onClick={onClick}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        style={{
          display: 'inline-block',
          verticalAlign: 'middle',
          width: FONT_SIZE + 2,
          height: FONT_SIZE + 2,
        }}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill={theme.linkColor}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M6 5.914l2.06-2.06v-.708L5.915 1l-.707.707.043.043.25.25 1 1h-3a2.5 2.5 0 0 0 0 5H4V7h-.5a1.5 1.5 0 1 1 0-3h3L5.207 5.293 5.914 6 6 5.914zM11 2H8.328l-1-1H12l.71.29 3 3L16 5v9l-1 1H6l-1-1V6.5l1 .847V14h9V6h-4V2zm1 0v3h3l-3-3z"
        />
      </svg>
    </a>
  )
})

interface StackTraceViewItemProps {
  onSelectFrame?: (frame: FlamechartFrame) => void
  onHoverFrame?: (frame: FlamechartFrame | null) => void
  onOpenFile?: (frame: Frame) => void
  getFrameColor: (frame: Frame) => string
  theme: Theme
  frame: FlamechartFrame
  isHovered: boolean
  isTop: boolean
}
const StackTraceViewItem: FunctionComponent<StackTraceViewItemProps> = memo(
  ({ theme, frame, onOpenFile, onSelectFrame, onHoverFrame, getFrameColor, isHovered, isTop }) => {
    let pos = ''
    if (frame.node.frame.file) {
      pos += frame.node.frame.file
      if (frame.node.frame.line != null) {
        pos += `:${frame.node.frame.line}`
        if (frame.node.frame.col != null) {
          pos += `:${frame.node.frame.col}`
        }
      }
    }

    const handleOnClick = useCallback(() => {
      typeof onSelectFrame === 'function' && onSelectFrame(frame)
    }, [onSelectFrame, frame])

    const handleOnMouseLeave = useCallback(() => {
      typeof onHoverFrame === 'function' && onHoverFrame(null)
    }, [onHoverFrame])

    const handleOnMouseEnter = useCallback(() => {
      typeof onHoverFrame === 'function' && onHoverFrame(frame)
    }, [onHoverFrame, frame])

    const handleOnOpenFile = useCallback(() => {
      typeof onOpenFile === 'function' && onOpenFile(frame.node.frame)
    }, [onOpenFile, frame])

    return (
      <div
        onClick={handleOnClick}
        onMouseLeave={handleOnMouseLeave}
        onMouseEnter={handleOnMouseEnter}
        style={{
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          background: isHovered ? theme.bgSecondaryColor : theme.bgPrimaryColor,
          borderBottom: `1px solid ${theme.borderColor}`,
          padding: '0px 8px',
        }}
      >
        <ColorChit color={getFrameColor(frame.node.frame)} />
        {isTop && <span style={{ color: theme.fgSecondaryColor }}>&gt; </span>}
        {frame.node.frame.name}
        <span style={{ color: theme.fgSecondaryColor }}> ({pos})</span>
        {onOpenFile && <GoToFile onClick={handleOnOpenFile} theme={theme} />}
      </div>
    )
  },
)

interface StackTraceViewProps {
  onSelectFrame?: (frame: FlamechartFrame) => void
  onHoverFrame?: (frame: FlamechartFrame | null) => void
  onOpenFile?: (frame: Frame) => void
  getFrameColor: (frame: Frame) => string
  theme: Theme
  frame: FlamechartFrame
  hoverFrame?: FlamechartFrame | null
}
function StackTraceView({
  onSelectFrame,
  onHoverFrame,
  onOpenFile,
  hoverFrame,
  theme,
  frame,
  getFrameColor,
}: StackTraceViewProps) {
  const rows: JSX.Element[] = []
  let currentFrame: FlamechartFrame | null = frame
  for (; currentFrame; currentFrame = currentFrame.parent) {
    const isHovered = currentFrame === hoverFrame
    rows.push(
      <StackTraceViewItem
        key={rows.length}
        onHoverFrame={onHoverFrame}
        onSelectFrame={onSelectFrame}
        onOpenFile={onOpenFile}
        isHovered={isHovered}
        frame={currentFrame}
        theme={theme}
        getFrameColor={getFrameColor}
        isTop={rows.length === 0}
      />,
    )
  }

  return (
    <div style={{ flex: '1', lineHeight: `2`, overflow: 'auto' }}>
      <div style={{ display: 'inline-block', minWidth: '100%' }}>
        <h4
          style={{
            padding: '2px 5px',
            margin: '0px',
            borderBottom: `1px solid ${theme.borderColor}`,
            userSelect: 'none',
          }}
        >
          Stack Trace
        </h4>
        {rows}
      </div>
    </div>
  )
}

interface FlamechartDetailViewProps {
  flamechart: Flamechart
  selectedFrame: FlamechartFrame
  theme: Theme
  style?: CSSProperties
  onSelectFrame?: (frame: FlamechartFrame) => void
  onHoverFrame?: (frame: FlamechartFrame | null) => void
  onOpenFile?: (frame: Frame) => void
  hoverFrame?: FlamechartFrame | null
}

export const FlamechartDetailView = memo((props: FlamechartDetailViewProps) => {
  const { theme, selectedFrame, style, hoverFrame, onSelectFrame, onHoverFrame, onOpenFile, flamechart } = props

  const getFrameColor = useCallback(
    (frame: Frame) => {
      return theme.colorForBucket(flamechart.getColorBucketForFrame(frame) / 255).toCSS()
    },
    [flamechart, theme],
  )

  return (
    <div
      style={{
        overflow: 'hidden',
        borderTop: `1px solid ${theme.borderColor}`,
        fontSize: FONT_SIZE + 'px',
        color: theme.fgPrimaryColor,
        background: theme.bgPrimaryColor,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        ...style,
      }}
    >
      <StackTraceView
        frame={selectedFrame}
        onSelectFrame={onSelectFrame}
        onHoverFrame={onHoverFrame}
        getFrameColor={getFrameColor}
        hoverFrame={hoverFrame}
        onOpenFile={onOpenFile}
        theme={theme}
      />
    </div>
  )
})
