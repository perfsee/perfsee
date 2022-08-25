import React from 'react'

export class FlamechartErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: unknown | null }> {
  static getDerivedStateFromError(error: unknown) {
    return { error: error }
  }

  constructor(props: never) {
    super(props)
    this.state = { error: null }
  }

  render() {
    if (this.state.error !== null) {
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            height: '100%',
          }}
        >
          <h3>⚠️ Flamechart Error</h3>
          <div style={{ overflow: 'auto', maxWidth: '100%' }}>
            <pre>
              {this.state.error instanceof Error
                ? `${this.state.error.message}\n${this.state.error.stack}`
                : '' + this.state.error}
            </pre>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export function withErrorBoundary<T extends React.FunctionComponent<any>>(WrappedComponent: T): T {
  return React.forwardRef((props: any, ref) => (
    <FlamechartErrorBoundary>
      <WrappedComponent ref={ref} {...props} />
    </FlamechartErrorBoundary>
  )) as any as T
}
