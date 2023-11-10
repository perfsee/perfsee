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

import Gatherer from 'lighthouse/types/gatherer'

export class GathererInstance implements LH.PerfseeGathererInstance {
  meta = {
    supportedModes: ['navigation' as const],
  }
  startInstrumentation(_context: Gatherer.Context): void | Promise<void> {}
  startSensitiveInstrumentation(_context: Gatherer.Context): void | Promise<void> {}
  stopInstrumentation(_context: Gatherer.Context): void | Promise<void> {}
  stopSensitiveInstrumentation(_context: Gatherer.Context): void | Promise<void> {}
  getArtifact(_context: Gatherer.Context): LH.PhaseResult {}

  get name() {
    let name = this.constructor.name
    // Rollup will mangle class names in an known way–just trim until `$`.
    if (name.includes('$')) {
      name = name.substr(0, name.indexOf('$'))
    }
    return name as any
  }
}
