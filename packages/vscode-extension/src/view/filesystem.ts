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

import { Disposable, EventEmitter, FileChangeEvent, FileStat, FileSystemProvider, FileType, Uri } from 'vscode'

export class PerfseeFileSystemProvider implements FileSystemProvider {
  onDidChangeFileEventEmitter = new EventEmitter<FileChangeEvent[]>()
  get onDidChangeFile() {
    return this.onDidChangeFileEventEmitter.event
  }
  watch(_uri: Uri, _options: { recursive: boolean; excludes: string[] }): Disposable {
    throw new Error('Method not implemented.')
  }
  stat(_uri: Uri): FileStat | Thenable<FileStat> {
    throw new Error('Method not implemented.')
  }
  readDirectory(_uri: Uri): [string, FileType][] | Thenable<[string, FileType][]> {
    throw new Error('Method not implemented.')
  }
  createDirectory(_uri: Uri): void | Thenable<void> {
    throw new Error('Method not implemented.')
  }
  readFile(_uri: Uri): Uint8Array | Thenable<Uint8Array> {
    throw new Error('Method not implemented.')
  }
  writeFile(_uri: Uri, _content: Uint8Array, _options: { create: boolean; overwrite: boolean }): void | Thenable<void> {
    throw new Error('Method not implemented.')
  }
  delete(_uri: Uri, _options: { recursive: boolean }): void | Thenable<void> {
    throw new Error('Method not implemented.')
  }
  rename(_oldUri: Uri, _newUri: Uri, _options: { overwrite: boolean }): void | Thenable<void> {
    throw new Error('Method not implemented.')
  }
}
