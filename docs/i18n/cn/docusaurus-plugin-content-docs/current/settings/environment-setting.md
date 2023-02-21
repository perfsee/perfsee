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

#### Cookies 的两种输入模式

默认为 Table 模式，按照提示输入数据。点击按钮可切换至批量输入模式。

##### Table

![](/settings/cookies-table.png)

##### Stringify

该格式无法直接方便地使用浏览器获取，建议安装第三方插件[EditThisCookie](https://chrome.google.com/webstore/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbg)，导出页面所需 cookies 粘贴至文本框即可。
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

### React Profiling

:::caution 注意

这是一个实验性的功能，可能存在不稳定的情况。如果没有按照预期工作，请向我们报告 Issue。

这个功能可能会降低页面渲染速度。

:::

![](/settings/react-profiling.png)

开启这个功能，会在 Lab 分析阶段收集 React 应用每个组件渲染时间等信息。分析报告中会展示组件火焰图，帮助我们分析 React 应用性能瓶颈。

这个功能是基于 React Profiler API 实现的，但 Profier API 在生产环境是关闭的。我们通过拦截 `react-don` 对应资源的请求，并将其替换成 profiling build 来解决这个问题。
