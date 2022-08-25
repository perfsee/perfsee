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

import { ConsoleLogger, Inject, Injectable, LoggerService, Provider } from '@nestjs/common'

const LoggerToken = Symbol('Logger')

export const LoggerProvider: Provider = {
  provide: LoggerToken,
  // register your custom logger here
  useClass: ConsoleLogger,
}

@Injectable()
export class Logger implements LoggerService {
  log = this.provider.log.bind(this.provider)
  error = this.provider.error.bind(this.provider)
  warn = this.provider.warn.bind(this.provider)
  debug = this.provider.debug?.bind(this.provider) ?? this.log
  verbose = this.provider.verbose?.bind(this.provider) ?? this.log

  constructor(@Inject(LoggerToken) private readonly provider: LoggerService) {}
}
