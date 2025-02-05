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

import { ForeignLink, IconWithTips, LabelWithTips, LazyMDX, RequiredTextField } from '@perfsee/components'
import { useSettings } from '@perfsee/platform/modules/shared'
import { staticPath } from '@perfsee/shared/routes'

export interface UserflowScriptProps {
  defaultScript?: string | null
}

const placeholder = `// Perfsee uses puppeteer to run scripts.
// The script only needs to call the methods on \`page\` to operate it.
// See https://pptr.dev/api/puppeteer.page.
await page.goto('https://test.com/')
const testButton = await page.waitForSelector('#test_button')
await testButton.click()

// Or you can record using Chrome devtools, which looks like:
const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch();
    const targetPage = await browser.newPage();
    {
        const promises = [];
        promises.push(targetPage.waitForNavigation());
        await targetPage.goto('https://test.com/');
        await Promise.all(promises);
    }
    {
        await targetPage.locator('#test_button').click();
    }
    await browser.close();
})().catch(err => {
    console.error(err);
    process.exit(1);
});
`

const label = (
  <LabelWithTips
    label="Userflow Script"
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

const userFlowLabel = () => import(/* webpackChunkName: "userflow-docs" */ './user-flow.mdx').then((res) => res.default)

export const UserflowScriptForm: FC<UserflowScriptProps> = forwardRef(({ defaultScript }, ref) => {
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

  const settings = useSettings()

  return (
    <Stack styles={{ root: { marginTop: '16px !important' } }}>
      <Stack horizontal verticalAlign="center">
        <Checkbox
          styles={{ label: { fontWeight: 600 } }}
          label="User Flow Mode (e2e)"
          checked={toggle}
          onChange={onChange}
        />
        <IconWithTips
          marginLeft="8px"
          content={LazyMDX({
            loadMDX: userFlowLabel,
          })}
        />
        {settings.enableMidscene ? (
          <ForeignLink style={{ fontSize: 12, marginLeft: 16 }} href="https://midscenejs.com">
            Natural languages support!
          </ForeignLink>
        ) : null}
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
          <RequiredTextField
            multiline
            onChange={onTextChange}
            maxLength={65535}
            value={script ?? ''}
            placeholder={
              settings.enableMidscene
                ? `// MidScene AI supported!!!
// You can use natural languages to describe the steps and control the page.
// For more api reference please visit https://midscenejs.com/api.
await ai('Type "headphones" in the search bar')
await ai('Click "Search"')

` + placeholder
                : placeholder
            }
            rows={20}
          />
        </Stack>
      )}
    </Stack>
  )
})
