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

import { IPersonaProps, Stack } from '@fluentui/react'
import { useInstance } from '@sigi/react'
import { useEffect, useState } from 'react'
import { lastValueFrom } from 'rxjs'

import { Empty } from '@perfsee/components'
import { userCookiesQuery } from '@perfsee/schema'
import { GraphQLClient } from '@perfsee/shared'

import { FormCookies } from '../project/settings/settings-environments/form-cookies'
import { CookieSchema } from '../shared'

export const UserCookie: React.FC<Partial<IPersonaProps>> = () => {
  const [cookies, setCookies] = useState<CookieSchema[] | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  const gqlClient = useInstance(GraphQLClient)

  useEffect(() => {
    lastValueFrom(
      gqlClient.query({
        query: userCookiesQuery,
      }),
    )
      .then((result) => {
        setCookies(result.user?.userCookies)
        setLastUpdate(result.user?.userCookiesLastUpdate || null)
      })
      .catch((e) => {
        console.error(e)
      })
  }, [gqlClient])

  if (cookies) {
    if (cookies.length) {
      return (
        <Stack styles={{ root: { maxWidth: 960 } }}>
          {lastUpdate ? <Stack>Last Sync: {new Date(lastUpdate).toLocaleString()}</Stack> : null}
          <FormCookies defaultCookies={cookies} readonly />
        </Stack>
      )
    }
    return <Empty withIcon title="No cookies uploaded" />
  }

  return null
}
