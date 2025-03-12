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
import { forwardRef, useCallback, useImperativeHandle, useState } from 'react'

import { ForeignLink, IconWithTips, LabelWithTips } from '@perfsee/components'
import { useSettings } from '@perfsee/platform/modules/shared'
import { staticPath } from '@perfsee/shared/routes'

import { ScriptEditor } from '../script-editor'

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

export const LoginScriptForm = forwardRef(({ defaultScript }: LoginScriptProps, ref) => {
  const [toggle, setToggle] = useState(!!defaultScript)
  const [script, setScript] = useState(defaultScript)

  useImperativeHandle(
    ref,
    () => ({
      setScript(s: string | null) {
        setScript(s)
      },
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

  const onTextChange = useCallback((value?: string, e?: any) => {
    if (!e || value === undefined) {
      return
    }
    setScript(value)
  }, [])

  const settings = useSettings()

  return (
    <>
      <Stack styles={{ root: { marginTop: 4 } }} horizontal>
        <Checkbox label="Enable login script" checked={toggle} onChange={onChange} />
        <IconWithTips
          marginLeft="8px"
          content="By enabling this feature, Perfsee will launch a page to run below script and store the cookies before lab, usually used to login the website."
        />
      </Stack>
      {toggle && (
        <Stack verticalAlign="center">
          <Stack horizontal verticalAlign="center">
            {label}
            <span style={{ marginLeft: 16, fontSize: 12, whiteSpace: 'pre' }}>You can </span>
            {settings.enableMidscene ? (
              <>
                <ForeignLink style={{ fontSize: 12 }} href="https://midscenejs.com/api">
                  use natural languages
                </ForeignLink>
                <span style={{ fontSize: 12, whiteSpace: 'pre' }}> or </span>
              </>
            ) : null}

            <ForeignLink
              style={{ fontSize: 12 }}
              href={staticPath.docs.home + '/lab/user-flow#record-using-chrome-devtools'}
            >
              record with devtools
            </ForeignLink>
          </Stack>
          <ScriptEditor
            onChange={onTextChange}
            value={script ?? ''}
            placeholder={
              settings.enableMidscene
                ? `// MidScene AI supported!!!
// You can use natural languages to describe the steps and control the page.
await ai('Type "your account id" in the account input')
await ai('Type "your password" in the password input')
await ai('Click "Login"')

` + placeholder
                : placeholder
            }
            supportMidscene={settings.enableMidscene}
            required
          />
        </Stack>
      )}
    </>
  )
})
