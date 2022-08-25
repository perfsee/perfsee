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

export interface FrameKey {
  function: string
  file: string
  line: number
  col: number
}

/**
 * parse frame key string, line and col will be NaN if it can't be parsed.
 */
export default function parseFrameKey(frameKey: string): FrameKey {
  const match = frameKey.match(/^(?<function>.*):(?<file>.*):(?<line>.*):(?<col>.*)$/)
  return {
    function: match?.groups?.['function'] ?? '',
    file: match?.groups?.['file'] ?? '',
    line: parseInt(match?.groups?.['line'] ?? ''),
    col: parseInt(match?.groups?.['col'] ?? ''),
  }
}
