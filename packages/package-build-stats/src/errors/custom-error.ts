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

/*
Portions of this software were originally licensed under the MIT License.
See the MIT License for more details.
*/

/*
MIT License

Copyright (c) 2017 Shubham Kanodia

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/*
The modifications to the original software were made by ByteDance,
and are licensed under the Apache License, Version 2.0.
*/

/**
 * Wraps the original error with a identifiable
 * name.
 */
class CustomError extends Error {
  originalError: any
  extra: any

  constructor(name: string, originalError: Error, extra?: any) {
    super(name)
    this.name = name
    this.originalError = originalError
    this.extra = extra
    Object.setPrototypeOf(this, CustomError.prototype)
  }

  toJSON() {
    return {
      name: this.name,
      originalError: this.originalError,
      extra: this.extra,
    }
  }
}

export class BuildError extends CustomError {
  constructor(originalError: any, extra?: any) {
    super('BuildError', originalError, extra)
    Object.setPrototypeOf(this, BuildError.prototype)
  }
}

export class EntryPointError extends CustomError {
  constructor(originalError: any, extra?: any) {
    super('EntryPointError', originalError, extra)
    Object.setPrototypeOf(this, EntryPointError.prototype)
  }
}

export class InstallError extends CustomError {
  constructor(originalError: any, extra?: any) {
    super('InstallError', originalError, extra)
    Object.setPrototypeOf(this, InstallError.prototype)
  }
}

export class PackageNotFoundError extends CustomError {
  constructor(originalError: any, extra?: any) {
    super('PackageNotFoundError', originalError, extra)
    Object.setPrototypeOf(this, PackageNotFoundError.prototype)
  }
}

export class CLIBuildError extends CustomError {
  constructor(originalError: any, extra?: any) {
    super('CLIBuildError', originalError, extra)
    Object.setPrototypeOf(this, CLIBuildError.prototype)
  }
}

export class MinifyError extends CustomError {
  constructor(originalError: any, extra?: any) {
    super('MinifyError', originalError, extra)
    Object.setPrototypeOf(this, MinifyError.prototype)
  }
}

export class MissingDependencyError extends CustomError {
  missingModules: Array<string>
  constructor(originalError: any, extra: { missingModules: Array<string> }) {
    super('MissingDependencyError', originalError, extra)
    this.missingModules = extra.missingModules
    Object.setPrototypeOf(this, MissingDependencyError.prototype)
  }
}

export class UnexpectedBuildError extends CustomError {
  constructor(originalError: any, extra?: any) {
    super('UnexpectedBuildError', originalError, extra)
    Object.setPrototypeOf(this, UnexpectedBuildError.prototype)
  }
}

export class WrongWebpackVersionError extends CustomError {
  constructor(originalError: any, extra?: any) {
    super('WrongWebpackVersionError', originalError, extra)
    Object.setPrototypeOf(this, WrongWebpackVersionError.prototype)
  }
}
