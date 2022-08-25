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

import {
  createCipheriv,
  createHmac,
  randomBytes,
  createDecipheriv,
  createHash,
  timingSafeEqual,
  pbkdf2Sync,
} from 'crypto'

import { Injectable } from '@nestjs/common'

import { Config } from '@perfsee/platform-server/config'

const NONCE_LENGTH = 12
const AUTH_TAG_LENGTH = 12

@Injectable()
export class CryptoService {
  constructor(private readonly config: Config) {}

  encrypt(data: string) {
    const iv = this.randomBytes()
    const cipher = createCipheriv('aes-256-gcm', this.key(), iv, {
      authTagLength: AUTH_TAG_LENGTH,
    })
    const encrypted = Buffer.concat([cipher.update(data, 'utf-8'), cipher.final()])
    const authTag = cipher.getAuthTag()
    return Buffer.concat([iv, authTag, encrypted]).toString('base64')
  }

  decrypt(encrypted: string) {
    const buf = Buffer.from(encrypted, 'base64')
    const iv = buf.slice(0, NONCE_LENGTH)
    const authTag = buf.slice(NONCE_LENGTH, NONCE_LENGTH + AUTH_TAG_LENGTH)
    const encryptedToken = buf.slice(NONCE_LENGTH + AUTH_TAG_LENGTH)
    const decipher = createDecipheriv('aes-256-gcm', this.key(), iv, { authTagLength: AUTH_TAG_LENGTH })
    decipher.setAuthTag(authTag)
    const decrepted = decipher.update(encryptedToken, void 0, 'utf8')
    return decrepted + decipher.final('utf8')
  }

  encryptPassword(password: string) {
    const salt = this.randomBytes()
    const hash = pbkdf2Sync(password, salt, 10000, 32, 'sha256')
    return Buffer.concat([salt, hash]).toString('base64')
  }

  verifyPassword(password: string, hashedPassword: string) {
    const buf = Buffer.from(hashedPassword, 'base64')
    const salt = buf.slice(0, NONCE_LENGTH)
    const hash1 = buf.slice(NONCE_LENGTH)

    const hash2 = pbkdf2Sync(password, salt, 10000, 32, 'sha256')
    return timingSafeEqual(hash1, hash2)
  }

  compare(one: string, other: string) {
    if (one.length !== other.length) {
      return false
    }

    return timingSafeEqual(Buffer.from(one), Buffer.from(other))
  }

  digest(data: string) {
    return createHmac('sha256', this.key()).update(this.randomBytes()).update(data).digest('base64')
  }

  randomBytes(length = NONCE_LENGTH) {
    return randomBytes(length)
  }

  sha256(data: string) {
    return createHash('sha256').update(data).digest()
  }

  key() {
    return this.sha256(this.config.secret)
  }
}
