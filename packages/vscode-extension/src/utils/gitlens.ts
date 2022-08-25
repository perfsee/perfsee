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

import { extensions, Uri } from 'vscode'

export function checkGitLensInstall() {
  return !!extensions.getExtension('eamodio.gitlens')
}

const pathNormalizeRegex = /\\/g
const pathStripTrailingSlashRegex = /\/$/g
const driveLetterNormalizeRegex = /(?<=^\/?)([A-Z])(?=:\/)/

export function normalizePath(
  fileName: string,
  options: { addLeadingSlash?: boolean; stripTrailingSlash?: boolean } = { stripTrailingSlash: true },
) {
  if (fileName == null || fileName.length === 0) return fileName

  let normalized = fileName.replace(pathNormalizeRegex, '/')

  const { addLeadingSlash, stripTrailingSlash } = { stripTrailingSlash: true, ...options }

  if (stripTrailingSlash) {
    normalized = normalized.replace(pathStripTrailingSlashRegex, '')
  }

  if (addLeadingSlash && normalized.charCodeAt(0) !== 47) {
    normalized = `/${normalized}`
  }

  if (process.platform === 'win32') {
    // Ensure that drive casing is normalized (lower case)
    normalized = normalized.replace(driveLetterNormalizeRegex, (drive: string) => drive.toLowerCase())
  }

  return normalized
}

export function toGitLensRevisionUri(commitHash: string, filePath: string, repoPath: string) {
  const normalizeFilePath = normalizePath(filePath, { addLeadingSlash: true })
  const data = {
    path: normalizeFilePath,
    ref: commitHash,
    repoPath: normalizePath(repoPath),
  }

  return Uri.parse(
    // Replace / in the authority with a similar unicode characters otherwise parsing will be wrong
    `gitlens://${encodeURIComponent(commitHash.substr(0, 7).replace(/\//g, '\u200A\u2215\u200A'))}${encodeURIComponent(
      normalizeFilePath,
    ).replace(/%2F/g, '/')}?${encodeURIComponent(JSON.stringify(data))}`,
  )
}
