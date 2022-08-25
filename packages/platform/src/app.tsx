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

import { DefaultButton } from '@fluentui/react'
import { MDXProvider } from '@mdx-js/react'
import { Component } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'

import { MDXComponents } from '@perfsee/components'
import { ThemeProvider } from '@perfsee/dls'

import { AppError, AppErrorTitle, Face } from './app.error'
import { Entry } from './routes'

import './icons'

export class App extends Component {
  static getDerivedStateFromError() {
    return {
      hasError: true,
    }
  }

  state = {
    hasError: false,
    triedRepair: false,
  }

  render() {
    if (this.state.hasError) {
      const reloadOrRepair = this.state.triedRepair ? 'reload' : 'repair'
      return (
        <ThemeProvider>
          <AppError>
            <Face>:(</Face>
            <AppErrorTitle>Our site ran into a problem and needs to {reloadOrRepair}.</AppErrorTitle>
            <AppErrorTitle>Click repair button below to try to {reloadOrRepair} this issue.</AppErrorTitle>
            <br />
            {!this.state.triedRepair && <DefaultButton onClick={this.onRepair}>Repair</DefaultButton>}
            {this.state.triedRepair && <DefaultButton onClick={this.onReload}>Reload</DefaultButton>}
          </AppError>
        </ThemeProvider>
      )
    }

    return (
      <ThemeProvider>
        <MDXProvider components={MDXComponents}>
          <Router>
            <Entry />
          </Router>
        </MDXProvider>
      </ThemeProvider>
    )
  }

  private readonly onRepair = () => {
    this.setState({
      triedRepair: true,
      hasError: false,
    })
  }

  private readonly onReload = () => {
    window.location.reload()
  }
}
