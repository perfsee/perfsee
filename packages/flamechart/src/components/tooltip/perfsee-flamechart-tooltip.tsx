import { Fragment } from 'react'

import { FlamechartImage } from '../../lib/flamechart-image'
import { PerfseeFrame } from '../../lib/perfsee-profile'
import { CallTreeNode, CallTreeNodeAttribute } from '../../lib/profile'
import { Theme } from '../../themes/theme'

export const PerfseeFlamechartTooltip: React.FC<{
  node: CallTreeNode
  theme: Theme
  formatValue: (v: number) => string
}> = ({ node, theme, formatValue }) => {
  const showLineNum = !!node.frame.file && !!node.frame.line && !!node.frame.col

  const frame = node.frame as PerfseeFrame

  const tipData = {
    Name: FlamechartImage.parseStrWithImageLabel(frame.name).str,
    'Self time': formatValue(node.getSelfWeight()),
    'Total time': formatValue(node.getTotalWeight()),
    File: (frame.file ?? frame.key) + (showLineNum ? `:${frame.line}:${frame.col}` : ''),
    'Aggregated self time': formatValue(frame.getSelfWeight()),
    'Aggregated total time': formatValue(frame.getTotalWeight()),
    Bundle: frame.info?.bundleName || '',
    Origin: frame.info?.origin || '',
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
