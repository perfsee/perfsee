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

import { GraphQLError } from 'graphql'
import { EMPTY, Observable, throwError } from 'rxjs'
import { catchError } from 'rxjs/operators'

import { notify } from '../notification'

export const ERROR_GUARD = '[User Error] '

export const createErrorCatcher =
  <T>(msg?: string, prevent = true) =>
  (observer: Observable<T>) => {
    return observer.pipe(
      catchError((errors: GraphQLError[] | Error) => {
        const error = Array.isArray(errors) ? errors[0] : (errors as any) instanceof Error ? errors : null

        let errorMsg = msg ?? ''

        if (error) {
          const guardIndex = error.message.indexOf(ERROR_GUARD)
          if (guardIndex !== -1) {
            errorMsg = error.message.slice(guardIndex + ERROR_GUARD.length)
          }
        }

        !__IS_SERVER__ &&
          errorMsg &&
          notify.error({
            content: errorMsg,
          })

        if (prevent) {
          return EMPTY
        }

        return throwError(() => errors)
      }),
    )
  }
