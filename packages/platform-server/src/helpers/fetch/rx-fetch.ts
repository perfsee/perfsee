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

import { Injectable } from '@nestjs/common'
import { merge, omit } from 'lodash'
import { AbortController } from 'node-abort-controller'
import fetch, { RequestInit } from 'node-fetch'
import { Observable, Observer } from 'rxjs'

export type RxFetchOptions = RequestInit & {
  raw?: true
}

@Injectable()
export class RxFetch {
  readonly get = this.rxFetchFactory('GET')
  readonly post = this.rxFetchFactory('POST')
  readonly put = this.rxFetchFactory('PUT')
  readonly delete = this.rxFetchFactory('DELETE')

  rxFetchFactory(method: 'GET' | 'POST' | 'PUT' | 'DELETE') {
    return <T>(
      url: string,
      options: RxFetchOptions = {
        headers: {
          'content-type': 'application/json',
        },
      },
    ): Observable<T> => {
      return this.rxFetch<T>(url, {
        headers: {
          'content-type': 'application/json',
        },
        ...options,
        method,
      })
    }
  }

  rxFetch<T>(url: string, options: RxFetchOptions): Observable<T> {
    return new Observable<T>((observer: Observer<T>) => {
      const abortController = new AbortController()
      const fetchOptions = merge(omit(options, 'raw'), {
        signal: abortController.signal,
      })

      fetch(url, fetchOptions)
        .then((response) => {
          if (options.raw) {
            return response
          }
          if (response.status >= 200 && response.status < 400) {
            if (response.headers.get('content-type')?.includes('application/json')) {
              return response.json()
            } else {
              return response.text()
            }
          } else {
            observer.error(response)
          }
        })
        .then((v: any) => {
          observer.next(v)
          observer.complete()
        })
        .catch((e) => {
          observer.error(e)
        })

      return () => {
        if (!abortController.signal.aborted) {
          abortController.abort()
        }
      }
    })
  }
}
