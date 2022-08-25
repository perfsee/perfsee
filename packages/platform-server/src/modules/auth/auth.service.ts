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

import { ExecutionContext, Injectable } from '@nestjs/common'
import { Request } from 'express'
import { noop } from 'lodash'
import { v4 as uuid } from 'uuid'

import { AccessToken, User } from '@perfsee/platform-server/db'
import { UserError } from '@perfsee/platform-server/error'
import { CryptoService } from '@perfsee/platform-server/helpers'
import { getRequestFromContext } from '@perfsee/platform-server/nestjs-extends'
import { Redis } from '@perfsee/platform-server/redis'
import { ExternalAccount } from '@perfsee/shared'

const RESET_PASSWORD_TOKEN_KEY = 'RESET_PASSWORD_TOKEN'
const OAUTH_STATE_KEY = 'OAUTH_STATE'

@Injectable()
export class AuthService {
  constructor(private readonly crypto: CryptoService, private readonly redis: Redis) {}

  async saveOauthState(state: Record<string, any>) {
    const token = uuid()
    await this.redis.set(`${OAUTH_STATE_KEY}-${token}`, JSON.stringify(state), 'EX', /* 3 hours */ 3600 * 3)

    return token
  }

  async getOauthState(token: string) {
    const state = await this.redis.get(`${OAUTH_STATE_KEY}-${token}`)
    return state ? (JSON.parse(state) as Record<string, any>) : null
  }

  async generatePasswordResetToken(user: User) {
    const token = uuid()
    await this.redis.set(`${RESET_PASSWORD_TOKEN_KEY}-${token}`, user.id, 'EX', /* 3 hours */ 3600 * 3)
    return token
  }

  async validateAndDeletePasswordResetToken(token: string) {
    const userId = await this.redis.get(`${RESET_PASSWORD_TOKEN_KEY}-${token}`)
    if (!userId) {
      return
    }

    await this.redis.del(`${RESET_PASSWORD_TOKEN_KEY}-${token}`)

    return User.findOneBy({ id: parseInt(userId, 10) })
  }

  availableOAuthProviders() {
    return Object.values(ExternalAccount)
  }

  async generateToken(user: User, tokenName: string, returnExist = false) {
    const existedToken = await AccessToken.createQueryBuilder()
      .select(['token'])
      .where({ userId: user.id, name: tokenName })
      .getRawOne<{ token: string }>()

    if (existedToken) {
      if (returnExist) {
        return existedToken.token
      }
      throw new UserError(`Token name '${tokenName}' has already existed.`)
    }

    return this.signToken(user, tokenName)
  }

  async invalidToken(user: User, tokenName: string) {
    const token = await AccessToken.createQueryBuilder()
      .select(['id', 'token'])
      .where({
        userId: user.id,
        name: tokenName,
      })
      .getRawOne<{ token: string; id: number }>()

    if (token) {
      await AccessToken.delete(token.id)
      await this.invalidCache(token.token)
    }
  }

  async getAllTokenRecords(user: User) {
    return AccessToken.findBy({ userId: user.id })
  }

  async getUserFromContext(context: ExecutionContext): Promise<User | null> {
    const req = getRequestFromContext(context)
    if (req) {
      return this.getUserFromRequest(req)
    }

    return null
  }

  async getUserFromRequest(req: Request): Promise<User | null> {
    if (req.user) {
      return req.user as User
    }

    if (req.session.user) {
      return req.session.user as User
    }

    const token = this.extractTokenFromHeader(req.headers.authorization)
    if (!token) {
      return null
    }

    const record = await this.findByToken(token)

    if (!record) {
      return null
    }

    const user = await User.findOneBy({ id: record.userId })

    req.user = user
    return user ?? null
  }

  private async findByToken(token: string) {
    const record = (await this.findInCache(token)) ?? (await this.findInDB(token))
    if (record) {
      await AccessToken.update({ id: record.id }, { lastUsedAt: new Date() })
    }

    return record
  }

  private async findInCache(token: string) {
    try {
      const res = await this.redis.get(token).catch(() => undefined)

      if (!res) {
        return
      }

      return JSON.parse(res) as AccessToken
    } catch {
      return
    }
  }

  private async findInDB(token: string) {
    return AccessToken.findOneBy({ token })
  }

  private async cache(key: string, value: string) {
    await this.redis.set(key, value, 'EX', /* 7 days */ 3600 * 24 * 7).catch(noop)
  }

  private async invalidCache(token: string) {
    await this.redis.del(token).catch(noop)
  }

  private async signToken(user: User, tokenName: string) {
    const prefix = user.isApp ? 'a' : 'u'
    const token = prefix + this.crypto.digest(`${prefix}-${user.id}-${tokenName}`)

    const record = AccessToken.create({
      userId: user.id,
      name: tokenName,
      token,
    })
    await AccessToken.save(record)
    await this.cache(token, JSON.stringify(record))

    return token
  }

  private extractTokenFromHeader(authorization?: string) {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return null
    }

    return authorization.substring(7)
  }
}
