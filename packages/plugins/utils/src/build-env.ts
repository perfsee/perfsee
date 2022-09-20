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

import envCI, { CiEnv } from 'env-ci'

import { getCurrentCommit, getProjectInfoFromGit } from './git'

type GithubEnv = {
  isCi: true
  name: 'GitHub Actions'
  service: 'github'
  commit: string
  build: string
  isPr: boolean
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
}

type BuildEnv = {
  isCi: boolean
  pwd: string
  platform: string
  upload: boolean
} & {
  git: Promise<GitEnv>
}

const envs = envCI() as CiEnv | GithubEnv

const gitEnvPromise: Promise<GitEnv | null> = Promise.resolve(null)

async function getGitEnv(): Promise<GitEnv> {
  if (envs.isCi && (envs.service === 'github' || envs.service === 'gitlab')) {
    const [namespace, name] = envs.slug.split('/')
    return {
      host: envs.service === 'github' ? 'github.com' : 'gitlab.com',
      namespace,
      name,
      branch:
        'isPr' in envs ? (envs.isPr && 'prBranch' in envs && envs.prBranch ? envs.prBranch : envs.branch) : envs.branch,
      commit: envs.commit,
      tag: 'tag' in envs ? (envs.tag !== 'undefined' ? envs.tag : void 0) : void 0,
    }
  } else {
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
}

export const BUILD_ENV: BuildEnv = {
  isCi: envs.isCi,
  pwd: 'root' in envs && envs.root ? envs.root : process.cwd(),
  platform: process.env.PERFSEE_PLATFORM_HOST ?? 'https://perfsee.com',
  upload: !process.env.PERFSEE_NO_UPLOAD && envs.isCi,
  git: gitEnvPromise.then((gitEnv) => (gitEnv ? Promise.resolve(gitEnv) : getGitEnv())),
}
