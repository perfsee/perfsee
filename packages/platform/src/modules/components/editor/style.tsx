import styled from '@emotion/styled'
import { NeutralColors } from '@fluentui/theme'

export const EditorContainer = styled.div({
  width: '100%',
  display: 'flex',
  border: `1px solid ${NeutralColors.gray130}`,
  borderRadius: '2px',

  '> div': {
    flexGrow: 1,
    width: '100%',
  },
})
