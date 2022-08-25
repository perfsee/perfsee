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

import { Redis } from '../../redis'

export class RedisStorage implements ThrottlerStorage {
  // useless but required by interface
  storage = {}

  constructor(private readonly redis: Redis) {}

  async getRecord(key: string): Promise<number[]> {
    const now = Date.now()
    return this.redis.lrange(key, 0, -1).then((list) => list.map((item) => parseInt(item)).filter((item) => item > now))
  }

  async addRecord(key: string, ttl: number): Promise<void> {
    await this.redis.rpush(key, Date.now() + ttl * 1000)

    const expiredAt = await this.redis.ttl(key)
    if (expiredAt === -1) {
      await this.redis.pexpire(key, ttl * 1000)
    }
  }
}
