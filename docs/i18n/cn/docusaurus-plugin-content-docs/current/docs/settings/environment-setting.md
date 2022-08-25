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

### 新建竞品环境

与新建环境的步骤一样，保存前勾选上 Competitor environment 的 checkbox。竞品环境只能关联竞品页面跟临时页面。竞品页面不能在手动触发扫描的时候被选择。

## 参数说明

### Cookies

可以设置自定义的 Cookie。主要应用于以下场景：

- 身份校验；
- 禁用广告以简化对开发人员特定的回归的故障排除；
- A/B test；

### Headers

设置自定义的 Headers

![environment headers](/settings/environment-headers.png)

1. **Apply to page load** 对应的 header 只会加到访问这个页面的第一个请求上【默认为该选项】
2. **Apply to all request** 对应的 header 会加到所有请求上
3. 可以输入**自定义的 host**，对应的 header 则会加到该 host 下的所有请求上

![environment header host](/settings/environment-header-host.png)
