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

import { SelectOutlined } from '@ant-design/icons'
import { Stack, Checkbox, Link } from '@fluentui/react'
import { FC, FormEvent, forwardRef, useCallback, useImperativeHandle, useState } from 'react'

import { ForeignLink, IconWithTips, LabelWithTips, LazyMDX, RequiredTextField } from '@perfsee/components'
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

  return (
    <Stack styles={{ root: { marginTop: '16px !important' } }}>
      <Stack horizontal>
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
      </Stack>
      {toggle && (
        <Stack verticalAlign="center">
          <Stack horizontal verticalAlign="center">
            {label}
            <ForeignLink
              style={{ fontSize: 12, marginLeft: 16 }}
              href={staticPath.docs.home + 'lab/e2e#record-using-chrome-devtools'}
            >
              Record using Chrome devtools <SelectOutlined />
            </ForeignLink>
          </Stack>
          <RequiredTextField
            multiline
            onChange={onTextChange}
            maxLength={65535}
            value={script ?? ''}
            placeholder={placeholder}
            rows={20}
          />
        </Stack>
      )}
    </Stack>
  )
})
