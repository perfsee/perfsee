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

import {
  CancellationToken,
  Event,
  FileDecoration,
  FileDecorationProvider,
  ProviderResult,
  ThemeColor,
  Uri,
} from 'vscode'

import { Colors } from '../constants'

export const DefinedDecorations = {
  second: new FileDecoration(undefined, undefined, new ThemeColor(Colors.Second)),
  faster: new FileDecoration(undefined, undefined, undefined),
  fast: new FileDecoration(undefined, undefined, undefined),
  medium: new FileDecoration(undefined, undefined, new ThemeColor(Colors.MediumColor)),
  slow: new FileDecoration(undefined, undefined, new ThemeColor(Colors.SlowColor)),
  slower: new FileDecoration(undefined, undefined, new ThemeColor(Colors.SlowerColor)),
  filtered: new FileDecoration('H', undefined, new ThemeColor(Colors.Second)),
}

const UriBase = 'perfsee://none'

export const DefinedDecorationUris = {
  second: Uri.parse(`${UriBase}?decoration=second`),
  faster: Uri.parse(`${UriBase}?decoration=faster`),
  fast: Uri.parse(`${UriBase}?decoration=fast`),
  medium: Uri.parse(`${UriBase}?decoration=medium`),
  slow: Uri.parse(`${UriBase}?decoration=slow`),
  slower: Uri.parse(`${UriBase}?decoration=slower`),
  filtered: Uri.parse(`${UriBase}?decoration=filtered`),
}

export class PerfseeVirtualFileSystemFileDecorationProvider implements FileDecorationProvider {
  onDidChangeFileDecorations?: Event<Uri | Uri[] | undefined> | undefined
  provideFileDecoration(uri: Uri, _token: CancellationToken): ProviderResult<FileDecoration> {
    if (uri.scheme !== 'perfsee') return null

    const searchParams = new URLSearchParams(uri.query)

    const decorationName = searchParams.get('decoration')

    return decorationName && DefinedDecorations[decorationName]
  }
}
