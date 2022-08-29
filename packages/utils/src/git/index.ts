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

export * from './host'

const sshRemoteRegex = /^.+@(.+):([^/]+)\/([^/]+)$/
export const parseGitRemoteUrl = (remote: string) => {
  if (!remote) {
    return null
  }

  remote = remote.replace(/.git$/, '')

  const match = remote.match(sshRemoteRegex)
  if (match) {
    return {
      host: match[1],
      namespace: match[2],
      name: match[3],
    }
  } else {
    try {
      const url = new URL(remote)
      const [, namespace, name] = url.pathname.split('/')
      if (!namespace || !name) {
        return null
      }

      return {
        host: url.hostname,
        namespace,
        name,
      }
    } catch {
      return null
    }
  }
}
