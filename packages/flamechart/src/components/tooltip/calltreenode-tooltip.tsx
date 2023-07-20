import { Fragment } from 'react'

import { FlamechartImage } from '@perfsee/flamechart/lib/flamechart-image'

import { CallTreeNode, CallTreeNodeAttribute } from '../../lib/profile'
import { Theme } from '../../themes/theme'

export const CallTreeNodeTooltip: React.FC<{
  node: CallTreeNode
  theme: Theme
  formatValue: (v: number) => string
}> = ({ node, theme, formatValue }) => {
  const showLineNum = !!node.frame.file && !!node.frame.line && !!node.frame.col

  const tipData = {
    Name: FlamechartImage.parseStrWithImageLabel(node.frame.name).str,
    'Self time': formatValue(node.getSelfWeight()),
    'Total time': formatValue(node.getTotalWeight()),
    File: (node.frame.file ?? node.frame.key) + (showLineNum ? `:${node.frame.line}:${node.frame.col}` : ''),
    'Aggregated self time': formatValue(node.frame.getSelfWeight()),
    'Aggregated total time': formatValue(node.frame.getTotalWeight()),
  }

  return (
    <div style={{ padding: '0 4px' }}>
      {!!(node.attributes & CallTreeNodeAttribute.LONG_TASK) && (
        <span style={{ color: theme.WarningColor }}>Long task took {formatValue(node.getTotalWeight())}</span>
      )}
      <div style={{ display: 'grid', grid: 'auto / auto auto' }}>
        {Object.keys(tipData).map((name) => {
          return (
            <Fragment key={name}>
              <span style={{ fontWeight: 'bold', paddingRight: '8px' }}>{name}</span>
              <span style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflowX: 'hidden' }}>
                {tipData[name]}
              </span>
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}
