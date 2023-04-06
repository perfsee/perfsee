import styled from '@emotion/styled'
import { NeutralColors, Stack } from '@fluentui/react'

import { darken } from '@perfsee/dls'

const ScoreDesc = styled.span({
  textOverflow: 'clip',
  fontWeight: 500,
})

const FailedContent = styled.span(({ theme }) => ({
  color: theme.text.colorSecondary,
}))

export const ColorScore = styled.b<{ color?: string; size?: number }>(
  ({ color = NeutralColors.black, size, theme }) => {
    return {
      fontSize: size,
      color,
      '> span': {
        fontSize: '18px',
        color: darken(theme.text.colorSecondary, 0.3),
        fontWeight: 400,
      },
    }
  },
)

export interface ScoreBlockProps {
  title: React.ReactNode
  value?: React.ReactNode
  color?: string
  unit?: React.ReactNode
  small?: boolean
}

export const ScoreTitle = styled.b<{ small: boolean }>(({ small }) => ({
  display: 'inline-block',
  margin: '0 5px 0 0',
  fontSize: small ? '24px' : '32px',
}))

export const ScoreBlock = ({ title, value, color, unit, small }: ScoreBlockProps) => {
  return (
    <Stack styles={{ root: { minWidth: '190px', padding: '12px 16px' } }}>
      <ScoreDesc>{title}</ScoreDesc>
      {typeof value === 'undefined' ? (
        <FailedContent>Failed to calculate</FailedContent>
      ) : (
        <ColorScore color={color}>
          <ScoreTitle small={small ?? false}>{value}</ScoreTitle>
          <span>{unit}</span>
        </ColorScore>
      )}
    </Stack>
  )
}
