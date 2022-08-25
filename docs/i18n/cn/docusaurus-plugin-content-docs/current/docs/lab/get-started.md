---
sidebar_position: 1
---

# 从 0 开始的 Lab 分析流程

## Step 1: 添加运行环境

### 设置 Profile

> Profile 管理应用测试时所使用的设备信息，包括窗口大小、CPU 速度、网络状况等信息。

每个项目都会默认创建一个 Profile：该 Profile 为视窗大小 1920 \* 1080 的 Chrome 浏览器、无网络限流、无 CPU 限流。

通过 **Project→Settings→Profile** 进行配置。更多细节请参考 [Profile 配置](../settings/profile-setting)。

![img](/settings/profiles.png)

### 设置 Environment

> Environment 用于配置自定义的 headers 和 cookies。

很多情况下我们并不能直接地访问到待测试页面，比如需要登录的应用。我们可以设置 Authorization header 或者 cookies 来模拟访问需要的配置。

每个项目都会创建一个无配置的默认环境。

通过 **Project→Settings→Environment** 进行配置。更多细节请参考 [Environment 配置](../settings/environment-setting)。

![](/settings/edit-environment.png)

## Step 2：添加待测试站点

添加一个站点，需要设置测试的 URL，易于识别的别名（name），关联之前添加的 Profile 和 Environment 设置。

在设置页面选择 Pages Tab 进入站点管理页面。更多细节请参考 [Pages 配置](../settings/page-setting) 。

![](/settings/create-page.png)

## Step 3：触发一次 Lab 扫描（手动）

我们可以手动触发 Lab 测试来试查看设置的正确性。

进入 **Project→Lab**，点击页面右上方的 `Take a snapshot` 按钮，选择想要测试的站点触发一次扫描。也可以勾选 `Specify config` 来选择要运行的 Profile 及 Environment。同时可以输入易于区别的 Title 来给 Snapshot 命名。

![](/lab/take-snapshot.png)

我们将一次 Lab 测试定义为一个 Snapshot。一个 Snapshot 包含多个页面、多个环境的运行报告。

扫描 3 个页面，每个页面关联了 2 个 Profiles，2 个 Environments，那么最终会有 12 份报告产出（3 x 2 x 2）

为了提供最可靠的运行结果，每一次 Lab 扫描都会运行 5 次，最终选择最稳定的测试结果供后期展示。

## Step 4：查看扫描结果

在 Lab 模块点击 Snapshot 卡片将会弹出该 Snapshot 中包含的所有运行结果，根据站点名称和运行环境进入想要查看的报告。

![](/lab/take-snapshot-detail.png)

### 概览

进入报告页面之后，默认将会展示性能概览数据。数据包括：

- 关键性能指标
- 运行时间线截图
- 运行录屏
- 主线程执行时间线

**关键性能指标**

平台的报告会使用不同的颜色标注关键性能指标，分值区间和颜色的对应关系如下：

- 0~ 49 (红色): 慢
- 50 ~ 89 (橘色): 平均值
- 90 ~ 100 (绿色): 快

![](/lab/report-detail-overview.png)

**主线程执行时间线**

可以直接的告诉我们，在站点加载过程中，哪一部分是长耗时的渲染任务或者阻塞的 JavaScript 执行，结合请求列表可以很容易的定位到性能瓶颈所在。

![](/lab/report-detail-main-thread.png)

### 请求列表

请求列表记录了站点加载过程中，所有的请求信息，列表根据请求发出时间升序排列。表格可以筛选、搜索、排序。点击请求将会展示请求的时间信息、请求头、响应头信息。

![](/lab/report-asset.png)

### Lighthouse 报告

在 Analysis Report 底下有 Performance / Accessibility / Best Practices / PWA / SEO 几个 Tab ，展示的是与 Lighthouse 分析结果相同的审计信息。

![](/lab/report-performance.png)

## Step 5：定时任务

进入 **Project→Settings->Schedule**，进行定时任务设置。设置每天、每 x 小时自动触发所选页面和运行环境的扫描。更多细节请参考 [Schedule 配置](../settings/schedule-setting)。

![](/settings/schedule.png)
