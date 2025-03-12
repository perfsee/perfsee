import { useMonaco, Editor } from '@monaco-editor/react'
import { useEffect, useMemo } from 'react'

import { ErrorMessage } from './settings-pages/style'

export interface EditorProps {
  value?: string
  onChange?: (value?: string) => void
  placeholder?: string
  required?: boolean
  supportMidscene?: boolean
}

export class PlaceholderContentWidget {
  private static readonly ID = 'editor.widget.placeholderHint'

  private domNode: HTMLElement | undefined

  constructor(private readonly placeholder: string, private readonly editor: any) {
    editor.onDidChangeModelContent(() => this.onDidChangeModelContent())
    this.onDidChangeModelContent()
  }

  getId(): string {
    return PlaceholderContentWidget.ID
  }

  getDomNode(): HTMLElement {
    if (!this.domNode) {
      this.domNode = document.createElement('div')
      this.domNode.style.width = 'max-content'
      this.domNode.style.pointerEvents = 'none'
      this.domNode.textContent = this.placeholder
      this.domNode.style.whiteSpace = 'pre'
      this.domNode.style.fontStyle = 'italic'
      this.editor.applyFontInfo(this.domNode)
    }

    return this.domNode
  }

  getPosition() {
    return {
      position: { lineNumber: 1, column: 1 },
      preference: [0],
    }
  }

  dispose(): void {
    this.editor.removeContentWidget(this)
  }

  private onDidChangeModelContent(): void {
    if (this.editor.getValue() === '') {
      this.editor.addContentWidget(this)
    } else {
      this.editor.removeContentWidget(this)
    }
  }
}

export const ScriptEditor = ({ value, onChange, placeholder, required, supportMidscene }: EditorProps) => {
  const monaco = useMonaco()

  const handleEditorDidMount = useMemo(() => {
    return (editor: any) => {
      if (placeholder) {
        new PlaceholderContentWidget(placeholder, editor)
      }
    }
  }, [placeholder])

  useEffect(() => {
    async function loadMonaco(monaco: any) {
      try {
        const response = await fetch('https://unpkg.com/puppeteer-core@21.11.0/lib/types.d.ts')
        const puppeteerTypes = await response.text()

        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
          target: monaco.languages.typescript.ScriptTarget.ESNext,
          allowNonTsExtensions: true,
          moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
          module: monaco.languages.typescript.ModuleKind.CommonJS,
          noEmit: true,
          skipLibCheck: true,
          allowJs: true,
          typeRoots: ['node_modules/@types'],
          lib: ['esnext'],
        })

        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: false,
          noSyntaxValidation: false,
        })

        // extra libraries
        monaco.languages.typescript.typescriptDefaults.addExtraLib(
          puppeteerTypes +
            `
declare global {
  const page: Page;
  const puppeteer: PuppeteerNode & {
    Locator: typeof Locator;
  };
${
  supportMidscene
    ? `
  interface AgentWaitForOpt {
    checkIntervalMs?: number;
    timeoutMs?: number;
  }
  interface AgentAssertOpt {
      keepRawResponse?: boolean;
  }

  function aiAction(taskPrompt: string): Promise<void>;
  function aiQuery(demand: any): Promise<any>;
  function aiAssert(assertion: string, msg?: string, opt?: AgentAssertOpt): Promise<any | undefined>;
  function aiWaitFor(assertion: string, opt?: AgentWaitForOpt): Promise<void>;
  function ai(taskPrompt: string, type?: string): Promise<any>;`
    : ''
}
}`,
          'node_modules/@types/external/index.d.ts',
        )
      } catch (error) {
        console.error('Failed to load types:', error)
      }
    }
    if (monaco) {
      void loadMonaco(monaco)
    }
  }, [monaco, supportMidscene])

  return (
    <>
      <Editor
        language="typescript"
        value={value}
        height="400px"
        onChange={onChange}
        options={{ minimap: { autohide: true }, automaticLayout: true }}
        onMount={handleEditorDidMount}
        path="main.js"
      />
      {required && !value ? <ErrorMessage style={{ fontSize: 12 }}>Required</ErrorMessage> : null}
    </>
  )
}
