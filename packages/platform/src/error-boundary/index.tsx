/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { useInstance } from '@sigi/react'
import { ErrorInfo, HTMLAttributes, PureComponent, ReactNode, memo } from 'react'

import { CrashIcon } from '@perfsee/components'
import { LoggerFactory, digestString } from '@perfsee/platform/common'

import { CrashContainer, crashIconStyle, CrashId, Recover } from './style'

export interface ErrorBoundaryProps extends HTMLAttributes<HTMLDivElement> {
  crashIconSize?: {
    width: number
    height: number
  }
  logger: LoggerFactory
}

interface ErrorBoundaryState {
  crashId: string | null
}

export class ErrorBoundaryClass extends PureComponent<ErrorBoundaryProps, ErrorBoundaryState> {
  static defaultProps: Pick<ErrorBoundaryProps, 'crashIconSize'> = {
    crashIconSize: {
      width: 40,
      height: 30,
    },
  }

  readonly state: ErrorBoundaryState = {
    crashId: null,
  }

  private crashTime = 0

  private lastError: (Error & { crashId?: string }) | null = null

  componentDidCatch(e: Error & { crashId?: string }, info: ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error(info)
    }
    const stackOrMessage = e.stack ?? e.message
    digestString(stackOrMessage)
      .then((fullCrashId) => {
        const crashId = fullCrashId.substring(0, 8)
        e.crashId = crashId
        if (this.lastError === null || crashId !== this.lastError.crashId) {
          this.props.logger.fatal('render error', e, { crashId })
          this.crashTime = 1
        } else {
          this.crashTime++
        }
        this.lastError = e
        this.setState({
          crashId,
        })
      })
      .catch((e) => {
        console.error(e)
      })
  }

  render() {
    const { crashIconSize, ...restProps } = this.props
    if (this.state.crashId) {
      const recoverText = this.crashTime > 1 ? 'Refresh' : 'Try Repairing'
      return (
        <CrashContainer {...restProps}>
          <CrashIcon
            css={crashIconStyle(crashIconSize!)}
            width={`${crashIconSize!.width}px`}
            height={`${crashIconSize!.height}px`}
          />
          <CrashId>{this.state.crashId}</CrashId>
          <Recover onClick={this.onRecover}>{recoverText}</Recover>
        </CrashContainer>
      )
    }
    return this.props.children
  }

  private readonly onRecover = () => {
    if (this.crashTime > 1) {
      window.location.reload()
    } else {
      this.setState({
        crashId: null,
      })
    }
  }
}

export const ErrorBoundary = memo<Omit<ErrorBoundaryProps, 'logger'> & { children: ReactNode }>((props) => {
  const logger = useInstance(LoggerFactory)
  return (
    <ErrorBoundaryClass logger={logger} {...props}>
      {props.children}
    </ErrorBoundaryClass>
  )
})
