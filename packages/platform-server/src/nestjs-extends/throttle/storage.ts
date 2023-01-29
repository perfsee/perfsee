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

import { ThrottlerStorage } from '@nestjs/throttler'
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface'

import { Redis } from '../../redis'

export class RedisStorage implements ThrottlerStorage {
  // useless but required by interface
  storage = {}

  constructor(private readonly redis: Redis) {}

  async increment(key: string, ttl: number): Promise<ThrottlerStorageRecord> {
    const totalHits = await this.redis.incr(key).catch(() => 1)

    let timeToExpire = await this.redis.pttl(key)
    if (timeToExpire === -1) {
      timeToExpire = ttl * 1000
      await this.redis.pexpire(key, timeToExpire)
    }

    return {
      totalHits,
      timeToExpire,
    }
  }
}
