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
import { In } from 'typeorm'

import { User, UserConnectedAccount, UserCookies } from '@perfsee/platform-server/db'
import { UserError } from '@perfsee/platform-server/error'
import { ObjectStorage } from '@perfsee/platform-server/storage'
import { CookieType, EMAIL_REGEXP, ExternalAccount } from '@perfsee/shared'

@Injectable()
export class UserService {
  constructor(private readonly storage: ObjectStorage) {}

  async findUserByEmail(email: string) {
    return User.findOneBy({ email })
  }

  async findUserById(userId: number) {
    return User.findOneBy({ id: userId })
  }

  async findUserByExternUsername(provider: ExternalAccount, externUsername: string) {
    const account = await UserConnectedAccount.findOneBy({
      provider,
      externUsername: externUsername,
    })
    return account ? this.findUserById(account.userId) : null
  }

  getUserConnectedAccounts(user: User) {
    return UserConnectedAccount.findBy({
      userId: user.id,
    })
  }

  getUserConnectedAccount(user: User, provider: ExternalAccount) {
    return UserConnectedAccount.findOneBy({
      userId: user.id,
      provider,
    })
  }

  async createUser(user: Partial<User>, fulfilled = true) {
    return User.create<User>({ ...user, isFulfilled: fulfilled }).save()
  }

  async updateUnfulfilledUser(user: User, information?: Partial<User>) {
    await User.update({ id: user.id }, { ...information, isFulfilled: true })
    return User.findOneByOrFail({ id: user.id })
  }

  async updateUserPassword(user: User, password: string) {
    await User.update({ id: user.id }, { password })
  }

  async connectAccount(user: User, provider: ExternalAccount, externUsername: string, accessToken: string) {
    await UserConnectedAccount.insert({
      userId: user.id,
      provider,
      externUsername,
      accessToken,
    })
  }

  async disconnectAccount(user: User, provider: ExternalAccount) {
    await UserConnectedAccount.delete({
      userId: user.id,
      provider,
    })
  }

  async updateAccountToken(user: User, provider: ExternalAccount, token: string) {
    await UserConnectedAccount.update(
      {
        userId: user.id,
        provider,
      },
      {
        accessToken: token,
      },
    )
  }

  async findOrCreateByEmails(emails: string[]) {
    const users = await this.findByEmailsInternal(emails)
    const createUsers = emails
      .filter((email) => !users.find((u) => u.email === email))
      .map((email) => User.create<User>({ username: '', email, isFulfilled: false }))
    await User.save(createUsers)
    return [...users, ...createUsers]
  }

  async getUserPassword(user: User): Promise<string | undefined> {
    const repo = User
    const raw = await repo
      .createQueryBuilder('user')
      .select('user.password', 'password')
      .where({
        id: user.id,
      })
      .getRawOne()

    return raw.password
  }

  async setAdmin(email: string) {
    const user = await this.findUserByEmail(email)
    if (!user) {
      throw new UserError('User not found')
    }
    user.isAdmin = true
    await user.save()
  }

  async anyUsers() {
    return (
      (await User.count({
        take: 2,
      })) !== 0
    )
  }

  async getUserCookies(email: string): Promise<CookieType[]> {
    const user = await User.findOneByOrFail({ email })
    const userCookie = await UserCookies.findOne({ where: { userId: user.id }, order: { createdAt: 'DESC' } })
    if (!userCookie?.cookieStorageKey) {
      return []
    }
    const buffer = await this.storage.get(userCookie.cookieStorageKey)
    return JSON.parse(buffer.toString())
  }

  async getUserCookiesLastUpdate(userId: number): Promise<Date | null> {
    const userCookie = await UserCookies.findOne({ where: { userId }, order: { createdAt: 'DESC' } })
    return userCookie?.createdAt || null
  }

  private async findByEmailsInternal(emails: string[]) {
    this.validateEmails(emails)

    return User.findBy({
      email: In(emails),
    })
  }

  private validateEmails(emails: string[]) {
    emails.forEach((email) => {
      const emailMatches = email.match(EMAIL_REGEXP)
      if (!emailMatches) {
        throw new UserError('Invalid email address')
      }
    })
  }
}
