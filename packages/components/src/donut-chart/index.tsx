import { Stack } from '@fluentui/react'
import { ReactNode, useMemo, useState } from 'react'

import { CircleWrapper, ColorfulDot, TableWrapper } from './style'

interface DonutChartProps {
  data: { name: string; value: number; key: string; color: string; extraLegend?: ReactNode }[]
  total: number
  showLegend?: boolean
  showEmpty?: boolean
  centerNode?: ReactNode
}

const barPerimeter = Math.PI * 16

export function DonutChart({ centerNode, showEmpty, showLegend, data, total }: DonutChartProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  const parts = useMemo(() => {
    const minWeight = 0.02
    const maxWeight = 1 - (data.length - 1) * minWeight

    let offset = 0

    return data.map(({ key, value, color }) => {
      const take = showEmpty ? Math.min(Math.max(value / total, minWeight), maxWeight) : value / total

      const circle = (
        <circle
          key={key}
          aria-label={key}
          cx="10"
          cy="10"
          r="8"
          fill="none"
          strokeWidth={2}
          stroke={color}
          strokeDasharray={barPerimeter}
          strokeDashoffset={(1 - take) * barPerimeter}
          transform={`rotate(${offset * 360})`}
          // safe to allow, we're already in memo
          // eslint-disable-next-line react/jsx-no-bind
          onMouseOver={() => setHoveredKey(key)}
          // eslint-disable-next-line react/jsx-no-bind
          onMouseOut={() => setHoveredKey(null)}
        />
      )
      offset += take
      return circle
    })
  }, [data, showEmpty, total])

  return (
    <Stack horizontal verticalAlign="center">
      <CircleWrapper>
        <svg viewBox="0 0 20 20" style={{ transform: 'rotate(-90deg)' }}>
          {parts}
        </svg>
        {centerNode && (
          <Stack
            verticalAlign="center"
            horizontalAlign="center"
            styles={{
              root: {
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              },
            }}
          >
            {centerNode}
          </Stack>
        )}
      </CircleWrapper>
      {showLegend && (
        <TableWrapper>
          <tbody>
            {data.map(({ extraLegend, name, key, color }) => (
              <tr key={name} className={hoveredKey === key ? 'focused' : undefined}>
                <td className="pod">
                  <ColorfulDot color={color} />
                </td>
                <td className="name">{name}</td>
                {extraLegend}
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      )}
    </Stack>
  )
}
