---
sidebar_position: 4
---

# Environment Setting

Configure environment information, and if you need to test login status, you need to configure the cookie or header.

:::warning

When **delete** environment, **all** snapshot report created by this environment will be deleted as well.

:::

![environments](/settings/environments.png)

These environments will be used in Lab triggered by manual / scheduled / other platforms.

## Features

### Create Environment

Click the `Create environment` button, fill in the relevant information.

The environment can be used to connect with project's Page, and can be selected when trigger a scan by manual.

![create environment](/settings/create-environment.png)

## Configurations

### Cookies

You can set the cookie for the environment for the following usage:

- Authorization validate
- Abandon advertisements to simplify the page for develops
- A/B test

#### Input type

Table mode is default, just input data according to the prompt. Click the button to switch to Stringify mode that can bulk create cookies.

##### Table

![](/settings/cookies-table.png)

##### Stringify

We don't have a convenient way to export cookies in Chrome, so we recommend installing [EditThisCookie](https://chrome.google.com/webstore/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbg) to export cookies.
![](/settings/cookies-stringify.png)

### Headers

Set custom headers for the environment.

![environment headers](/settings/environment-headers.png)

1. **Apply to page load** This header would only be added to the first request of the page.
2. **Apply to all request** This header would be added to all requests.
3. You can input **any host**, and the corresponding header would be added to the matched host.

![environment header host](/settings/environment-header-host.png)

#### Input type

Table mode is default, just input data according to the prompt. Click the button to switch to Stringify mode that can bulk create headers.

![](/settings/headers-stringify.png)

### Login script

![login script](/settings/login-script.png)

By enabling this feature, Perfsee will launch a page to run the script and store the cookies before lab, usually used to login the website.

Perfsee uses [puppeteer](https://pptr.dev/) to run scripts. The scripts are compatible with most common puppeteer APIs.

The page is injected into the script environment global variable `page`. **The login script only needs to call the methods on `page` to operate it**. See [Puppeteer Page API](https://pptr.dev/api/puppeteer.page) for more details.

Here is an example:

```js
await page.goto('https://test.com/')

const accountInput = await page.waitForSelector('#account_input')
await accountInput.type('account')

const passwordInput = await page.waitForSelector('#password_input')
await passwordInput.type('password')

const loginButton = await page.waitForSelector('#login')
await loginButton.click()

await page.waitForNavigation()
```
