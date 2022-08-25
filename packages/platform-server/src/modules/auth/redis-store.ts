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

import { Store, SessionData } from 'express-session'
import { noop } from 'lodash'

import { Redis } from '@perfsee/platform-server/redis'

export class RedisStore extends Store {
  static create(redisClient: any) {
    return new RedisStore(redisClient)
  }

  private constructor(private readonly redisClient: Redis) {
    super()
  }

  getStore() {
    return this.redisClient
  }

  get = async (sid: string, callback: (err: any, session?: SessionData | null) => void) => {
    try {
      const store = this.getStore()
      const data = await store.get(sid)
      if (!data) {
        callback(data)
      } else {
        callback(null, JSON.parse(data))
      }
    } catch (e) {
      callback(e)
    }
  }

  set = async (sid: string, sessionData: SessionData, callback: (err?: any) => void = noop) => {
    try {
      const data = JSON.stringify(sessionData)
      const ttl = this.getTTL(sessionData)

      const store = this.getStore()
      await store.set(sid, data, 'EX', ttl)
      callback()
    } catch (e) {
      callback(e)
    }
  }

  destroy = (_sid: string) => {}

  private getTTL(sessionData: SessionData) {
    let ttl
    if (sessionData.cookie.expires && typeof sessionData.cookie.expires !== 'boolean') {
      const ms = Number(new Date(sessionData.cookie.expires)) - Date.now()
      ttl = Math.ceil(ms / 1000)
    } else {
      ttl = 14 * 24 * 60 * 60 * 1000
    }
    return ttl
  }
}
