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

import chalk from 'chalk'
import envCI, { CiEnv } from 'env-ci'

import { GitHost } from '@perfsee/utils'

import { getCurrentCommit, getProjectInfoFromGit } from './git'

type GithubEnv = {
  isCi: true
  name: 'GitHub Actions'
  service: 'github'
  commit: string
  build: string
  isPr: boolean
  pr?: string
  branch: string
  prBranch?: string
  slug: string
  root: string
}

type GitEnv = {
  host: string
  namespace: string
  name: string
  commit: string
  branch: string
  tag?: string
  pr?: {
    number: number
    baseHash: string
    headHash: string
  }
}

type BuildEnv = {
  isCi: boolean
  pwd: string
  platform: string
  upload: boolean
} & {
  git: Promise<GitEnv | null>
}

const envs = envCI() as CiEnv | GithubEnv

function getPr(): GitEnv['pr'] {
  try {
    const event = process.env.GITHUB_EVENT_PATH ? require(process.env.GITHUB_EVENT_PATH) : undefined

    if (event?.pull_request) {
      return {
        number: parseInt(event.pull_request.number),
        baseHash: event.pull_request.base.sha as string,
        headHash: event.pull_request.head.sha as string,
      }
    }
  } catch {
    // Noop
  }
}

function getCiCommit() {
  try {
    const event = process.env.GITHUB_EVENT_PATH ? require(process.env.GITHUB_EVENT_PATH) : undefined

    if (event?.pull_request) {
      return event.pull_request.head.sha
    }
  } catch {
    // Noop
  }
}

function getCiBranch() {
  if (envs.isCi) {
    if ('isPr' in envs && envs.isPr) {
      if (envs.service === 'github' && process.env['GITHUB_HEAD_REF']) {
        return process.env['GITHUB_HEAD_REF']
      } else {
        return 'prBranch' in envs && envs.prBranch ? envs.prBranch : envs.branch
      }
    } else {
      return envs.branch
    }
  }
}

async function getGitEnv(): Promise<GitEnv> {
  if (envs.isCi) {
    if (envs.service === 'github' || envs.service === 'gitlab') {
      const commit = getCiCommit() || envs.commit
      const branch = getCiBranch() || envs.branch
      const [namespace, name] = envs.slug.split('/')

      return {
        host: envs.service === 'github' ? GitHost.Github : GitHost.Gitlab,
        namespace,
        name,
        commit,
        branch,
        pr: getPr(),
      }
    } else if (
      // @ts-expect-error type is outdated
      envs.service === 'vercel'
    ) {
      return {
        namespace: process.env.VERCEL_GIT_REPO_OWNER!,
        name: process.env.VERCEL_GIT_REPO_SLUG!,
        branch: process.env.VERCEL_GIT_COMMIT_REF!,
        commit: process.env.VERCEL_GIT_COMMIT_SHA!,
        host:
          process.env.VERCEL_GIT_PROVIDER === 'github'
            ? GitHost.Github
            : process.env.VERCEL_GIT_PROVIDER === 'gitlab'
            ? GitHost.Gitlab
            : GitHost.Unknown,
      }
    } else {
      console.error(
        chalk.red(`[perfsee] Unsupported CI service ${envs.service}. We will try to support it in the future.`),
      )
    }
  }

  const project = await getProjectInfoFromGit()
  const commit = await getCurrentCommit()
  if (!project || !commit) {
    throw new Error('Failed to get repository info')
  }

  return {
    host: project.host,
    namespace: project.namespace,
    name: project.name,
    branch: project.branch,
    commit,
  }
}

let buildEnv: BuildEnv | null = null

export function getBuildEnv() {
  if (!buildEnv) {
    buildEnv = {
      isCi: envs.isCi,
      pwd: 'root' in envs && envs.root ? envs.root : process.cwd(),
      platform: process.env.PERFSEE_PLATFORM_HOST ?? 'https://perfsee.com',
      upload: !process.env.PERFSEE_NO_UPLOAD && envs.isCi,
      git: getGitEnv().catch(() => null),
    }
  }

  return buildEnv
}
