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

import { Stack, Checkbox, Link } from '@fluentui/react'
import { FC, FormEvent, forwardRef, useCallback, useImperativeHandle, useState } from 'react'

import { IconWithTips, LabelWithTips, RequiredTextField } from '@perfsee/components'

export interface LoginScriptProps {
  defaultScript?: string | null
}

const placeholder = `// Perfsee uses puppeteer to run scripts.
// The script only needs to call the methods on \`page\` to operate it.
// See https://pptr.dev/api/puppeteer.page.
await page.goto('https://test.com/')

const accountInput = await page.waitForSelector('#account_input')
await accountInput.type('account')

const passwordInput = await page.waitForSelector('#password_input')
await passwordInput.type('password')

const loginButton = await page.waitForSelector('#login')
await loginButton.click()

await page.waitForNavigation()
`

const label = (
  <LabelWithTips
    label="Login Script"
    tips={
      <>
        Perfsee uses puppeteer to run scripts. The scripts are compatible with most common Puppeteer APIs. The page is
        injected into the script environment global variable `page`.
        <br />
        <b>The script only needs to call the methods on `page` to operate it.</b> See{' '}
        <Link href="https://pptr.dev/api/puppeteer.page">Puppeteer Page API</Link> for more details..
      </>
    }
  />
)

export const LoginScriptForm: FC<LoginScriptProps> = forwardRef(({ defaultScript }, ref) => {
  const [toggle, setToggle] = useState(!!defaultScript)
  const [script, setScript] = useState(defaultScript)

  useImperativeHandle(
    ref,
    () => ({
      getScript() {
        return script
      },
    }),
    [script],
  )

  const onChange = useCallback((_event: any, checked?: boolean) => {
    if (!checked) {
      setScript(null) // remove script
    } else {
      setScript((script) => script || '')
    }
    setToggle(!!checked)
  }, [])

  const onTextChange = useCallback((e?: FormEvent<HTMLElement | HTMLInputElement>, value?: string) => {
    if (!e || value === undefined) {
      return
    }
    setScript(value)
  }, [])

  return (
    <>
      <Stack horizontal>
        <Checkbox label="Enable login script" checked={toggle} onChange={onChange} />
        <IconWithTips
          marginLeft="8px"
          content="By enabling this feature, Perfsee will launch a page to run below script and store the cookies before lab, usually used to login the website."
        />
      </Stack>
      {toggle && (
        <Stack verticalAlign="center">
          {label}
          <RequiredTextField
            multiline
            onChange={onTextChange}
            maxLength={65535}
            value={script ?? ''}
            placeholder={placeholder}
            rows={15}
          />
        </Stack>
      )}
    </>
  )
})
