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

import { AuthenticationProviderId } from 'perfsee-vscode/constants'
import { CancellationToken, EventEmitter, Progress, ProgressLocation, window, authentication } from 'vscode'

import { ApiClient, UnauthorizedError } from '../api/api-client'
import { Repository } from '../types/git'
import { CancelablePromise, CanceledError, createCancelablePromise } from '../utils/async'
import Logger from '../utils/logger'
import { getGitAPI } from '../utils/repo-watcher'

import Project from './project'

export type LoadingProgress = Progress<{
  message?: string | undefined
  increment?: number | undefined
}>

class App {
  projects: Project[] = []
  repositories: Repository[] = []

  scanPromise: CancelablePromise<{
    projects: Project[]
    repositories: Repository[]
  }> = createCancelablePromise(() => Promise.resolve(null as any))

  projectsPromise: Promise<Project[]> = Promise.resolve([])

  private readonly onBeforeProjectsUpdateEventEmitter = new EventEmitter<void>()
  private readonly onDidProjectsUpdateEventEmitter = new EventEmitter<{ prev: Project[]; next: Project[] }>()

  get onBeforeProjectsUpdateEvent() {
    return this.onBeforeProjectsUpdateEventEmitter.event
  }
  get onDidProjectsUpdateEvent() {
    return this.onDidProjectsUpdateEventEmitter.event
  }

  scanProjects() {
    this.scanPromise.cancel()
    this.scanPromise = createCancelablePromise((cancellationToken) => {
      return window.withProgress(
        { cancellable: false, location: ProgressLocation.Window, title: 'Perfsee Loading' },
        (progress) => {
          return this.scanProjectsOnWorkspace(progress, cancellationToken)
        },
      )
    })
    this.projectsPromise = this.scanPromise.then((result) => result.projects)
    this.onBeforeProjectsUpdateEventEmitter.fire()
    this.scanPromise
      .then(({ projects, repositories }) => {
        const prev = this.projects
        this.projects = projects
        this.repositories = repositories
        this.onDidProjectsUpdateEventEmitter.fire({ prev, next: projects })
        Logger.debug('[app] Projects Updated')
      })
      .catch((err) => {
        if (err instanceof CanceledError) {
          Logger.debug('[app] Projects update canceled.')
        }
        if (err instanceof UnauthorizedError) {
          Logger.debug('[app] authorization error, login may be required.')
          throw err
        } else {
          Logger.err(err)
        }

        throw err
      })
  }

  async scanProjectsOnRepositoriesChanged() {
    const gitExtensionApi = await getGitAPI()

    const newRepositories = gitExtensionApi.repositories
    const oldRepositories = this.repositories

    const changed =
      newRepositories.length !== oldRepositories.length ||
      newRepositories.filter(
        (repo) => !oldRepositories.some((oldRepo) => oldRepo.state.HEAD?.commit === repo.state.HEAD?.commit),
      ).length

    if (changed) {
      this.scanProjects()
      return true
    }

    return false
  }

  async scanProjectsOnWorkspace(progress?: LoadingProgress, cancellationToken?: CancellationToken) {
    const authenticationSession = await authentication.getSession(AuthenticationProviderId, ['all'], { silent: true })
    if (!authenticationSession) {
      throw new UnauthorizedError()
    }

    const apiClient = new ApiClient(authenticationSession)

    // find all git repo by vscode official git extension
    // ps: may be multiple git repo, may be multiple workspaces.
    const gitExtensionApi = await getGitAPI()

    const result: Project[] = []

    const repositories = gitExtensionApi.repositories

    for (const repository of repositories) {
      if (repository.rootUri.scheme === 'file') {
        const fsPath = repository.rootUri.fsPath

        try {
          const projects = await Project.loadProjects(fsPath, apiClient, progress, cancellationToken)
          if (cancellationToken?.isCancellationRequested) {
            throw new CanceledError()
          }

          result.push(...projects)
        } catch (err) {
          if (err instanceof CanceledError) {
            throw err
          }
          if (err instanceof UnauthorizedError) {
            throw err
          } else {
            Logger.debug(`skip repo ${fsPath}`, err)
          }
        }
      }
    }

    return { projects: result, repositories }
  }

  *getProjectsByFilePath(absoluteFilePath: string) {
    for (const project of this.projects) {
      // if the current file is not in the project path, skip
      if (!absoluteFilePath.startsWith(project.root)) continue

      yield project
    }
  }

  *getProfilesByFilePath(absoluteFilePath: string, fileCommitHash?: string) {
    for (const project of this.getProjectsByFilePath(absoluteFilePath)) {
      // if project or profile not found
      if (project.isError || !project.activatedHash || !project.profiles || project.profiles.length === 0) continue

      for (const profile of project.profiles) {
        if ((fileCommitHash && !profile.commitHash.startsWith(fileCommitHash)) || profile.filtered) continue
        yield profile
      }
    }
  }
}

const defaultApp = new App()

export default defaultApp
