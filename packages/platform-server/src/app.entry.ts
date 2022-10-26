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

import '@abraham/reflection'

import { NestFactory, Reflector } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { raw, json } from 'body-parser'
import session from 'express-session'

import { AppModule } from './app.module'
import { Config } from './config'
import { Logger } from './logger'
import { Metric } from './metrics'
import { RedisStore, PreAuthGuard, AuthService } from './modules'
import { QueryErrorFilter, UnauthorizedExceptionFilter, AnyErrorFilter, RedisThrottleGuard } from './nestjs-extends'
import { Redis } from './redis'

export async function createApp() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  })
  app.useLogger(app.get(Logger))
  app.use(raw({ limit: '500mb' }))
  app.use(json({ limit: '10mb' }))

  const redis = app.get(Redis)
  const config = app.get(Config)
  const metrics = app.get(Metric)

  app.set('trust proxy', 1)
  app.use(
    session({
      resave: true,
      saveUninitialized: false,
      store: RedisStore.create(redis),
      secret: config.secret,
      name: 'perfsee_sid',
      cookie: {
        maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
        secure: process.env.NODE_ENV !== 'development',
        httpOnly: true,
        sameSite: 'lax',
      },
      rolling: false,
    }),
  )

  app.setGlobalPrefix(config.path)
  app.useGlobalFilters(new AnyErrorFilter(app.getHttpAdapter()))
  app.useGlobalFilters(new QueryErrorFilter())
  app.useGlobalFilters(new UnauthorizedExceptionFilter())
  app.useGlobalGuards(new RedisThrottleGuard({ limit: 120, ttl: 60 }, redis, metrics, app.get(Reflector)))
  app.useGlobalGuards(new PreAuthGuard(app.get(AuthService)))

  async function start() {
    await app.listen(config.port)

    process.once('SIGUSR2', () => {
      void app.close()
    })
  }
  return { start, app }
}
