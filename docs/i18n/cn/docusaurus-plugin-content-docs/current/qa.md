# FAQ

## 通用

### 任务长时间 Pending

由于平台中任务采用排队机制，在任务量大的时候可能会导致队列消费慢，任务长时间处于 Pending 状态。可以通过平台左下角**Status**入口进入查看当前排队任务数量。

## Bundle 模块

### 编译失败语法错误

插件支持的最低 node 版本为 **12**。

### Bundle 的基准选取规则

基于项目设置内的 `Bundle Baseline Branch` 项内设置的分支作为的基准，基准一旦选定，后续不会再变更。初始默认为 `master` 分支，想要自定义基准分支可以到项目设置里更改。

### 验证 SourceMap 是否上传成功

找到对应的 Bundle 分析结果，在 Audit tab 中会有一条规则为 `Missing sourcemap for js assets`。该规则报警时，说明 SourceMap 没有成功收集到。

![audit sourcemap](/faq/audit-sourcemap.png)

## Lab 模块

### 如何对比查看多份报告

[如何对比查看多份报告](./lab/multi-reports)

### 如何测试需要登录才能访问的页面

在项目的 [Environment 设置](./settings/environment-setting)里配置 Cookies 或者 Headers 认证登录。

### 指标是如何计算的

[Performance Scoring](https://web.dev/performance-scoring/)

### 资源加载时间过长，是否有网络延迟

1. 首先，Lab 是在标准的环境中运行，即便存在网络延迟，也是不可控的，建议重新触发一次任务查看结果。
2. 如果加载时间长的文件为 CDN 静态资源，检查该资源是否命中缓存
3. API 请求时间过长，建议检查业务逻辑，线上监控

## Source 模块

### 插件在使用过程中是实时扫描，这样会影响编写代码的效率吗？

不会，VSCode 插件系统保证插件与编辑器强隔离运行在不同的进程，插件运行不会造成任何卡顿和延迟。

如果你觉得代码中的性能信息显示过多，对编码产生了干扰，可以点击 VSCode 界面下方状态栏中的 Performance 按钮禁用性能信息显示。

![vscode plugin disable](/faq/vscode-plugin-disable.png)

### 插件显示 “missing commit in local”

![vscode plugin missing commit](/faq/vscode-plugin-missing-commit.png)

显示这个警告的原因是插件在本地没有找到当前版本（图中是 local.108）的 commit，通常是本地 git 仓库没有更新，运行 git fetch 即可。缺少 commit 不会影响插件正常工作，少数功能需要读取本地 commit。

### 插件安装后没有数据

请确保当前打开的工程在平台中有对应的项目，并且正确接入了 Bundle 及 Lab 模块。Lab 模块的扫描需通过发布平台上线触发，或者给 Lab Snapshot 手动设置 commit。
