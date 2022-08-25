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

import { Injectable } from '@sigi/di'
import { merge } from 'lodash'
import { Observable, Observer } from 'rxjs'

@Injectable()
export class RxFetch {
  readonly get = this.rxFetchFactory('GET')
  readonly post = this.rxFetchFactory('POST')
  readonly put = this.rxFetchFactory('PUT')
  readonly delete = this.rxFetchFactory('DELETE')

  private rxFetchFactory(method: 'GET' | 'POST' | 'PUT' | 'DELETE') {
    return <T>(url: string, options?: RequestInit): Observable<T> => {
      return this.rxFetch<T>(url, { ...options, method })
    }
  }

  private rxFetch<T>(url: string, options: RequestInit): Observable<T> {
    return new Observable<T>((observer: Observer<T>) => {
      const abortController = new AbortController()

      fetch(
        url,
        merge(options, {
          signal: abortController.signal,
        }),
      )
        .then((response) => {
          if (response.status >= 400) {
            observer.error(response)
          } else {
            if (response.headers.get('content-type')?.includes('application/json')) {
              return response.json()
            } else {
              return response.text()
            }
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
