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

export enum GitHost {
  Unknown = 'Unknown',
  Github = 'Github',
  Gitlab = 'Gitlab',
}

export interface IGitHost {
  path: string
  repoUrl: () => string
  commitUrl: (hash: string) => string
  branchUrl: (branch: string) => string
  tagUrl: (tag: string) => string
  diffUrl: (hash: string, baseHash: string) => string
}

export const hostDomains = {
  [GitHost.Github]: 'github.com',
  [GitHost.Gitlab]: 'gitlab.com',
  [GitHost.Unknown]: 'unknown-git-host.com',
}

export class CommonGitHost implements IGitHost {
  path: string

  constructor(project: { host: GitHost; namespace: string; name: string }) {
    this.path = `${hostDomains[project.host] ?? ''}/${project.namespace}/${project.name}`
  }

  repoUrl(): string {
    return `https://${this.path}`
  }
  commitUrl(hash: string) {
    return `https://${this.path}/commits/${hash}`
  }
  branchUrl(branch: string) {
    return `https://${this.path}/tree/${branch}`
  }
  tagUrl(tag: string) {
    return `https://${this.path}/tree/${tag}`
  }
  diffUrl(from: string, to: string) {
    return `https://${this.path}/compare/${from}...${to}`
  }
  prUrl(number: number) {
    return `https://${this.path}/pull/${number}`
  }
}

export function gitHostFromDomain(domainOrHost: string): GitHost {
  const existing = GitHost[domainOrHost]
  if (existing) {
    return existing
  }

  if (domainOrHost.includes('github.com')) {
    return GitHost.Github
  } else if (domainOrHost.includes('gitlab.com')) {
    return GitHost.Gitlab
  }

  return GitHost.Unknown
}
