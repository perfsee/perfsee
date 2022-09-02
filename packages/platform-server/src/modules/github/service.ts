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

import { readFileSync } from 'fs'

import { Injectable } from '@nestjs/common'
import qs from 'query-string'
import { lastValueFrom } from 'rxjs'

import { Config } from '@perfsee/platform-server/config'
import { User } from '@perfsee/platform-server/db'
import { UserError } from '@perfsee/platform-server/error'
import { paginate, PaginationInput } from '@perfsee/platform-server/graphql'
import { RxFetch } from '@perfsee/platform-server/helpers'
import { Logger } from '@perfsee/platform-server/logger'
import { Redis } from '@perfsee/platform-server/redis'
import { ExternalAccount } from '@perfsee/shared'

import { UserService } from '../user'

import { githubAppJwt } from './github-app-jwt'
import {
  GithubCheckRun,
  GithubCheckRunParameters,
  GithubComment,
  GithubInstallation,
  GithubInstallationAccessToken,
  GithubRepository,
} from './types'

const INSTALLATION_ACCESS_TOKEN_CACHE_KEY = 'INSTALLATION_ACCESS_TOKEN_CACHE'
const INSTALLATION_CACHE_KEY = 'INSTALLATION_CACHE_KEY'

@Injectable()
export class GithubService {
  cachedGithubAppJWT: { token: string; expiration: number } | null = null
  privateKey: string
  available: boolean

  constructor(
    private readonly userService: UserService,
    private readonly logger: Logger,
    private readonly config: Config,
    private readonly fetch: RxFetch,
    private readonly redis: Redis,
  ) {
    const privateKeyFile = this.config.github.privateKeyFile
    if (!privateKeyFile) {
      this.logger.warn('privateKeyFile is not configured, github service is unavailable.')
      this.privateKey = ''
      this.available = false
    } else {
      this.privateKey = readFileSync(privateKeyFile, 'utf8')
      this.available = true
    }
  }

  /**
   * Verify that the github project exists and the current user has permissions to the project.
   */
  async verifyGithubRepositoryPermission(
    user: User,
    owner: string,
    repo: string,
  ): Promise<{ ok: false; error: string } | { ok: true; caseSensitiveRepo: string; caseSensitiveOwner: string }> {
    const githubAccount = await this.userService.getUserConnectedAccount(user, ExternalAccount.github)
    if (!githubAccount || !githubAccount.accessToken) {
      return {
        ok: false,
        error: `Please connect your github account first.`,
      }
    }

    let repositoryInfo
    try {
      repositoryInfo = await this.getRepository(owner, repo, githubAccount.accessToken)
    } catch (err) {
      if (err instanceof GithubApiError && err.status === 404) {
        return {
          ok: false,
          error: `Repository ${owner}/${repo} not found`,
        }
      }
      throw err
    }

    const caseSensitiveRepo = repositoryInfo.name
    const caseSensitiveOwner = repositoryInfo.owner.login

    if (!(repositoryInfo.permissions.admin || repositoryInfo.permissions.maintain)) {
      return {
        ok: false,
        error: `The github account ${githubAccount.externUsername} does not have maintain permission for the ${caseSensitiveOwner}/${caseSensitiveRepo}.`,
      }
    }

    try {
      await this.getInstallationByRepository(owner, repo)
    } catch (err) {
      if (err instanceof GithubApiError && err.status === 404) {
        return {
          ok: false,
          error: `Can't find github app installation for ${caseSensitiveOwner}/${caseSensitiveRepo}.`,
        }
      }
      throw err
    }
    return {
      ok: true,
      caseSensitiveRepo,
      caseSensitiveOwner,
    }
  }

  async searchRepositories(query: string, pagination: PaginationInput, installationAccessToken: string) {
    if (pagination.after) {
      throw new UserError('pagination.after is not supported for this function.')
    }

    if (pagination.skip % pagination.first !== 0) {
      throw new UserError('pagination.skip must be a multiple of pagination.first for this function.')
    }

    const page = pagination.skip / pagination.first + 1
    const perPage = pagination.first
    const result = await this.fetchApi<{
      total_count: number
      items: GithubRepository[]
    }>(
      'GET',
      `https://api.github.com/search/repositories`,
      {
        q: query,
        page,
        per_page: perPage,
      },
      installationAccessToken,
      false,
    )

    return paginate(result.items, 'id', pagination, result.total_count)
  }

  updateCheckRun(
    checkRunId: number,
    owner: string,
    repo: string,
    installationAccessToken: string,
    params: GithubCheckRunParameters,
  ) {
    return this.fetchApi<GithubCheckRun>(
      'PATCH',
      `https://api.github.com/repos/${owner}/${repo}/check-runs/${checkRunId}`,
      params,
      installationAccessToken,
    )
  }

  async createCheckRun(
    hash: string,
    owner: string,
    repo: string,
    installationAccessToken: string,
    params: GithubCheckRunParameters,
  ) {
    return this.fetchApi<GithubCheckRun>(
      'POST',
      `https://api.github.com/repos/${owner}/${repo}/check-runs`,
      { head_sha: hash, ...params },
      installationAccessToken,
    )
  }

  async createIssueComment(
    owner: string,
    repo: string,
    issueNumber: number,
    body: string,
    installationAccessToken: string,
  ) {
    return this.fetchApi<GithubComment>(
      'POST',
      `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
      { body },
      installationAccessToken,
    )
  }

  async updateIssueComment(
    owner: string,
    repo: string,
    commentId: number,
    body: string,
    installationAccessToken: string,
  ) {
    return this.fetchApi<GithubComment>(
      'PATCH',
      `https://api.github.com/repos/${owner}/${repo}/issues/comments/${commentId}`,
      { body },
      installationAccessToken,
    )
  }

  async getIssueComment(owner: string, repo: string, commentId: number, installationAccessToken: string) {
    return this.fetchApi<GithubComment>(
      'GET',
      `https://api.github.com/repos/${owner}/${repo}/issues/comments/${commentId}`,
      null,
      installationAccessToken,
    )
  }

  async getInstallationAccessToken(installationId: number) {
    const cached = await this.redis.get(`${INSTALLATION_ACCESS_TOKEN_CACHE_KEY}-${installationId}`)
    if (cached) {
      const cachedAccessToken = JSON.parse(cached) as GithubInstallationAccessToken
      if (Date.now() + 3 * 60 * 1000 < Date.parse(cachedAccessToken.expires_at)) {
        // If the remaining time is more than 3 minutes, return the cached token, otherwise create a new token
        return cachedAccessToken.token
      }
    }
    const newToken = await this.fetchApi<GithubInstallationAccessToken>(
      'POST',
      `https://api.github.com/app/installations/${installationId}/access_tokens`,
    )
    await this.redis.set(
      `${INSTALLATION_ACCESS_TOKEN_CACHE_KEY}-${installationId}`,
      JSON.stringify(newToken),
      'EX',
      // The installation tokens expire 1 hour from the time you create them.
      60 * 60,
    )
    return newToken.token
  }

  async getInstallationByUser(username: string) {
    try {
      return await this.fetchApi<GithubInstallation>('GET', `https://api.github.com/users/${username}/installation`)
    } catch (err) {
      if (err instanceof GithubApiError && err.status === 404) {
        return null
      }
      throw err
    }
  }

  async getAssociatedInstallationsByUser(pagination: PaginationInput, userToken: string) {
    if (pagination.after) {
      throw new UserError('pagination.after is not supported for this function.')
    }

    if (pagination.skip % pagination.first !== 0) {
      throw new UserError('pagination.skip must be a multiple of pagination.first for this function.')
    }

    const page = pagination.skip / pagination.first + 1
    const perPage = pagination.first

    const result = await this.fetchApi<{
      total_count: number
      installations: GithubInstallation[]
    }>(
      'GET',
      `https://api.github.com/user/installations`,
      {
        page,
        per_page: perPage,
      },
      userToken,
      true,
    )

    return paginate(result.installations, 'id', pagination, result.total_count)
  }

  async getInstallationByRepository(owner: string, repo: string) {
    const cached = await this.redis.get(`${INSTALLATION_CACHE_KEY}-${owner}-${repo}`)
    if (cached) {
      return JSON.parse(cached) as GithubInstallation
    }
    const data = await this.fetchApi<GithubInstallation>(
      'GET',
      `https://api.github.com/repos/${owner}/${repo}/installation`,
    )
    await this.redis.set(
      `${INSTALLATION_CACHE_KEY}-${owner}-${repo}`,
      JSON.stringify(data),
      'EX',
      // cache 30 seconds
      30,
    )
    return data
  }

  async getRepository(owner: string, repo: string, userToken: string) {
    return this.fetchApi<GithubRepository>('GET', `https://api.github.com/repos/${owner}/${repo}`, {}, userToken, true)
  }

  async getInstallationById(installationId: number) {
    return this.fetchApi<GithubInstallation>('GET', `https://api.github.com/app/installations/${installationId}`)
  }

  getInstallUrl() {
    return `https://github.com/apps/${this.config.github.appname}/installations/new`
  }

  private fetchApi<Response>(
    method: 'GET' | 'POST' | 'DELETE' | 'PATCH',
    url: string,
    body?: Record<string, any> | null | undefined,
    token: string = this.getJWT(),
    isOauth2Token = false,
  ): Promise<Response> {
    return lastValueFrom(
      this.fetch.rxFetch(method === 'GET' && body ? qs.stringifyUrl({ url: url, query: body }) : url, {
        body: body && method !== 'GET' ? JSON.stringify(body) : undefined,
        headers: {
          Authorization: `${isOauth2Token ? 'token' : 'Bearer'} ${token}`,
          'content-type': 'application/json',
          Accept: 'application/vnd.github.v3+json',
        },
        method,
      }),
    ).catch((res) => {
      throw new GithubApiError(url, res)
    }) as Promise<Response>
  }

  private getJWT() {
    if (this.cachedGithubAppJWT && Date.now() / 1000 < this.cachedGithubAppJWT.expiration - 60 * 2) {
      return this.cachedGithubAppJWT.token
    }

    this.cachedGithubAppJWT = githubAppJwt(this.config.github.appid, this.privateKey)
    return this.cachedGithubAppJWT.token
  }
}

export class GithubApiError extends Error {
  readonly status: number
  constructor(public readonly url: string, public readonly res: Response) {
    super(`Fetch Github Api Error [${url}]\n\tstatus: ${res.status}`)
    this.status = res.status
  }
}
