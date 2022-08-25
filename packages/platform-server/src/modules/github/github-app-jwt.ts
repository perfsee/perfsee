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

import crypto from 'crypto'

export function githubAppJwt(id: string, privateKey: string, now = Math.floor(Date.now() / 1000)) {
  const expiration = now + 60 * 10
  const payload = { iat: now - 60, exp: now + 60 * 10, iss: id }
  const header = { alg: 'RS256', typ: 'JWT' }
  const encoded = `${Buffer.from(JSON.stringify(header)).toString('base64')}.${Buffer.from(
    JSON.stringify(payload),
  ).toString('base64')}`

  const sign = crypto.createSign('SHA256')
  sign.write(encoded)
  sign.end()
  const signature = sign.sign(privateKey, 'base64')

  return { token: `${encoded}.${signature}`, expiration }
}
