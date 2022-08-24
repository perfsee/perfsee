import { editor, IDisposable } from 'monaco-editor/esm/vs/editor/editor.api'
import { FC, memo, useEffect, useRef } from 'react'

import { EditorContainer } from './style'

type Props = {
  value?: string
  height?: string
  onChange?: (value: string) => void
}

export const MonacoEditor: FC<Props> = memo((props) => {
  const { value = '', height = '400px', onChange } = props

  const instanceRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const subscriptionRef = useRef<IDisposable | null>(null)
  const eleRef = useRef<HTMLDivElement>(null)

  // create editor
  useEffect(() => {
    if (eleRef.current) {
      instanceRef.current = editor.create(eleRef.current, {
        value,
        language: 'javascript',
        minimap: {
          enabled: false,
        },
        lightbulb: {
          enabled: true,
        },
        codeLens: true,
      })
    }

    return () => {
      if (instanceRef.current) {
        instanceRef.current.dispose()
        const model = instanceRef.current.getModel()

        if (model) {
          model.dispose()
        }
      }
    }
    // don't update when value change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // onChange event
  useEffect(() => {
    if (instanceRef.current && onChange) {
      subscriptionRef.current?.dispose()

      subscriptionRef.current = instanceRef.current.onDidChangeModelContent(() => {
        const editorValue = instanceRef.current?.getValue() ?? ''

        onChange(editorValue)
      })
    }

    return () => {
      subscriptionRef.current?.dispose()
    }
  }, [onChange])

  return (
    <EditorContainer>
      <div ref={eleRef} style={{ height }} />
    </EditorContainer>
  )
})
