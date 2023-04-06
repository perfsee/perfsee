import styled from '@emotion/styled'

export const SourceZoneContainer = styled.div(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flexWrap: 'wrap',
  padding: '12px 16px',
  border: `1px solid ${theme.border.color}`,
  borderRadius: '4px',
}))

export const SourceZoneTitle = styled.div({
  display: 'flex',
  gap: '8px',
  margin: '8px 0 0px 0',
  fontSize: '16px',
  fontWeight: '700',
})

export const SourceStateToolbar = styled.div({
  display: 'flex',
  marginBottom: '16px',
  alignItems: 'center',
  justifyContent: 'space-between',
})

export const SourceZoneSubtitle = styled.div(({ theme }) => ({
  marginBottom: '8px',
  fontSize: '16px',
  color: theme.text.colorSecondary,
}))

export const SourceScoreList = styled.div({
  display: 'flex',
  alignItems: 'center',
  margin: '0 -16px',
  gap: 16,
})

export const ArtifactInfoContainer = styled.div(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  color: theme.text.colorSecondary,
  whiteSpace: 'nowrap',
  '> div': {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    overflow: 'hidden',
  },
  span: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
}))

export const ArtifactHeaderContainer = styled.div({
  display: 'flex',
  flexDirection: 'column',
  width: '400px',
  gap: 8,
})

export const ArtifactHeader = styled.div({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
})

export const ArtifactZoneContainer = styled(SourceZoneContainer)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 32px',
})

export const ExpandingCardWrapper = styled.div({
  padding: '10px 20px',
})
