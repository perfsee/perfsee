---
sidebar_position: 4
---

# Environment 设置

配置环境信息，如需要测试登陆态，需要配置校验的 cookie 或者 header。

:::warning

当 **删除** environment 的时候，**所有**使用该 environment 生成的 snapshot report 也会被一并删除。

:::

![environments](/settings/environments.png)

在这里配置的环境，将在 Lab 功能的手动触发 / 定时任务 / 其他平台上线触发 中使用。

## 功能说明

### 新建环境

点击 Create environment 按钮，填写相关信息。

该环境可用于关联项目里的 Page，也可在手动触发扫描时被选择。

![create environment](/settings/create-environment.png)

## 参数说明

### Cookies

可以设置自定义的 Cookie。主要应用于以下场景：

- 身份校验；
- 禁用广告以简化对开发人员特定的回归的故障排除；
- A/B test；

#### Cookies 的两种输入模式

默认为 Table 模式，按照提示输入数据。点击按钮可切换至批量输入模式。

##### Table

![](/settings/cookies-table.png)

##### Stringify

该格式无法直接方便地使用浏览器获取，建议安装第三方插件[EditThisCookie](https://chromewebstore.google.com/detail/editthiscookie/ojfebgpkimhlhcblbalbfjblapadhbol)，导出页面所需 cookies 粘贴至文本框即可。
![](/settings/cookies-stringify.png)

### Headers

设置自定义的 Headers

![environment headers](/settings/environment-headers.png)

1. **Apply to page load** 对应的 header 只会加到访问这个页面的第一个请求上【默认为该选项】
2. **Apply to all request** 对应的 header 会加到所有请求上
3. 可以输入**自定义的 host**，对应的 header 则会加到该 host 下的所有请求上

![environment header host](/settings/environment-header-host.png)

#### Headers 的输入模式

默认为 Table 模式，按照提示输入数据，如上图。点击按钮可切换至批量输入模式。
![](/settings/headers-stringify.png)

### 登录脚本

![login script](/settings/login-script.png)

开启这个功能后，Perfsee 会在 Lab 分析之前启动一个标签页页运行该脚本并保存所有 cookies，这个功能通常用于自动登录网站。

:::tip
你可以使用自然语言编写脚本或者从浏览器调试工具中录制脚本，更多信息请查看[编写 userflow 脚本](/lab/user-flow#step-2编写-user-flow-脚本)。
:::

Perfsee 使用 [puppeteer](https://pptr.dev/) 来运行脚本，脚本兼容大部分常用 Puppeteer API。

标签页会被注入到脚本环境全局变量 `page` 中。 登录脚本只需要调用 `page` 上的方法即可对页面进行操作。更多方法请看 [Puppeteer Page API](https://pptr.dev/api/puppeteer.page).

例子:

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
