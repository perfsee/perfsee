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

import vscode, { Disposable } from 'vscode'

import { GitExtension, Repository, API as GitApi } from '../types/git'

import Logger from './logger'

let gitApi: GitApi

export async function getGitAPI() {
  if (gitApi) {
    return gitApi
  }

  const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git')
  if (!gitExtension) {
    throw new Error('Builtin extension `vscode.git` is required')
  }

  gitApi = (gitExtension.isActive ? gitExtension.exports : await gitExtension.activate()).getAPI(1)
  return gitApi
}

/**
 * watch workspace git repo change, dependent on vscode official git extension.
 */
export function startRepoWatcher(onChange: () => void) {
  type RepositoryIdentifier = string
  const RepositoriesDisposable = new Map<RepositoryIdentifier, vscode.Disposable>()

  getGitAPI()
    .then((gitExtensionApi) => {
      let initialized = false

      gitExtensionApi.onDidChangeState(() => {
        if (gitExtensionApi.state === 'initialized') {
          onInitialized()
        }
      })

      if (gitExtensionApi.state === 'uninitialized') {
        // if git extension is not ready
        Logger.debug('git extension is uninitialized')
      } else {
        onInitialized()
      }

      function onInitialized() {
        if (initialized) return

        gitExtensionApi.onDidOpenRepository((repository) => {
          listenRepository(repository)
          onChange()
        })

        gitExtensionApi.onDidCloseRepository((repository) => {
          unlistenRepository(repository)
          onChange()
        })

        gitExtensionApi.repositories.forEach(listenRepository)

        Logger.debug('start watch git repo.')

        initialized = true
      }

      function listenRepository(repository: Repository) {
        const repositoryIdentifier = repository.rootUri.toString()
        if (RepositoriesDisposable.has(repositoryIdentifier)) return

        let prevHEAD = repository.state.HEAD?.commit
        const didChangeHandle = () => {
          const currentHEAD = repository.state.HEAD?.commit
          if (prevHEAD !== currentHEAD) {
            prevHEAD = currentHEAD
            onChange()
          }
        }

        const disposable = repository.state.onDidChange(didChangeHandle)

        RepositoriesDisposable.set(repositoryIdentifier, disposable)
      }

      function unlistenRepository(repository: Repository) {
        const repositoryIdentifier = repository.rootUri.toString()
        RepositoriesDisposable.get(repositoryIdentifier)?.dispose()
        RepositoriesDisposable.delete(repositoryIdentifier)
      }
    })
    .catch((e) => {
      Logger.err(e)
    })

  // TODO: Disposable
  return new Disposable(() => {})
}
