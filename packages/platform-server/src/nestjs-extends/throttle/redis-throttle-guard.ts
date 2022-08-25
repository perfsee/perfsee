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

import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { GqlContextType } from '@nestjs/graphql'
import { ThrottlerException, ThrottlerGuard, ThrottlerModuleOptions } from '@nestjs/throttler'
import { Request, Response } from 'express'

import { Metric } from '../../metrics'
import { Redis } from '../../redis'
import { getRequestResponseFromContext } from '../utils'

import { RedisStorage } from './storage'

export class RedisThrottleGuard extends ThrottlerGuard {
  metrics: Metric

  constructor(options: ThrottlerModuleOptions, redis: Redis, metrics: Metric, reflector: Reflector) {
    super(options, new RedisStorage(redis), reflector)

    this.metrics = metrics
  }

  getTracker(req: Request) {
    return req.headers.authorization ?? req.ip
  }

  getRequestResponse(context: ExecutionContext): { req: Request; res: Response } {
    return getRequestResponseFromContext(context)
  }

  async handleRequest(context: ExecutionContext, limit: number, ttl: number) {
    const { req, res } = this.getRequestResponse(context)
    if (Array.isArray(this.options.ignoreUserAgents)) {
      for (const pattern of this.options.ignoreUserAgents) {
        const ua = req.headers['user-agent']
        if (ua && pattern.test(ua)) {
          return true
        }
      }
    }

    let tracker = this.getTracker(req)

    if (limit !== this.options.limit || ttl !== this.options.ttl) {
      tracker += ';custom'
    }

    const key = this.generateKey(context, tracker)
    const ttls = await this.storageService.getRecord(key)
    const nearestExpiryTime = ttls.length > 0 ? Math.ceil((ttls[0] - Date.now()) / 1000) : 0
    if (ttls.length >= limit) {
      res.header('Retry-After', nearestExpiryTime.toString())
      this.metrics.openApiCallThrottled(1)
      throw new ThrottlerException(this.errorMessage)
    }
    res.header(`${this.headerPrefix}-Limit`, limit.toString())
    res.header(`${this.headerPrefix}-Remaining`, Math.max(0, limit - (ttls.length + 1)).toString())
    res.header(`${this.headerPrefix}-Reset`, nearestExpiryTime.toString())
    await this.storageService.addRecord(key, ttl)
    return true
  }

  generateKey(context: ExecutionContext, suffix: string) {
    if (suffix.endsWith(';custom')) {
      return super.generateKey(context, suffix)
    }

    return suffix
  }

  async canActivate(context: ExecutionContext) {
    if (context.getType<GqlContextType>() !== 'graphql') {
      return true
    }
    const { req } = this.getRequestResponse(context)
    if (req.session.user) {
      return true
    }

    return super.canActivate(context)
  }
}
