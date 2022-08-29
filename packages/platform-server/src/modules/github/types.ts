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

export interface GithubInstallation {
  id: number
  account: {
    login: string
    avatar_url: string
    type: 'Organization' | 'User'
  }
  permissions: GithubAppPermissions
}

export type GithubAppPermissions = Record<string, string>

export interface GithubInstallationAccessToken {
  token: string
  expires_at: string
  permissions: GithubAppPermissions
}

export interface GithubPullRequest {
  id: number
  number: number
  head: {
    ref: string
    sha: string
  }
  base: {
    ref: string
    sha: string
  }
}

export interface GithubCheckRun {
  id: number
  pull_requests: GithubPullRequest[]
}

export interface GithubComment {
  id: number
  body: string
}

export interface GithubCheckRunParameters {
  name: string
  status?: 'queued' | 'in_progress' | 'completed'
  conclusion?: 'action_required' | 'cancelled' | 'failure' | 'neutral' | 'success' | 'skipped' | 'stale' | 'timed_out'
  started_at?: string
  completed_at?: string
  external_id?: string
  details_url?: string
  output?: GithubCheckRunOutput
}

export interface GithubCheckRunOutput {
  title: string
  summary: string
  text?: string
}

export interface GithubRepository {
  id: number
  name: string
  full_name: string
  private: boolean
  default_branch: string
  owner: {
    login: string
  }
  permissions: {
    admin: boolean
    maintain: boolean
    push: boolean
    triage: boolean
    pull: boolean
  }
}
