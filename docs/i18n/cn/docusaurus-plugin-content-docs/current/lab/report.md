---
sidebar_position: 2
---

# Lab 报告详情

![img](/lab/report-detail.png)

**_功能介绍与截图中标记序号对应_**

#### 1. Snapshot Id 或者 Snapshot Title

#### 2. 页面切换

#### 3. Profile 切换

#### 4. Environment 切换

#### 5. 添加该报告到多报告对比栏

详细功能介绍可点击：[多报告对比介绍](./multi-reports)

#### 6. 查看检测页面的源地址

## Overview

Overview Tab 下主要展示该页面的性能指标，请求资源类型饼图，页面渲染过程录屏，渲染过程关键时间点截图，以及主线程执行时间图表。

### 性能指标

有颜色高亮的指标是参与了性能分数计算的指标。我们对其所在分值区间和颜色设立了如下的对应关系：

- 0~ 49 (红色): 慢
- 50 ~ 89 (橘色): 平均值
- 90 ~ 100 (绿色): 快

![img](/lab/report-metrics.png)

### 渲染过程

此为渲染过程关键时间点截图，点击右侧 「Render video」 按钮，可观看渲染流程的录屏。

![img](/lab/report-render-timeline.png)

### 主线程执行时间图表

将 Lab 运行期间的浏览器主线程执行过程可视化出来。其中执行时间小于 **15ms** 的任务(JS/Layout/Rendering) 被过滤不予显示，减少信息噪音。而执行时间超过 50ms 的任务被标记为 **Long task** 。在图表的上方用红色线标出。

![img](/lab/report-long-task.png)

渲染 **FP, FCP, LCP, DCL, LOAD, FMP** 等关键指标时间点。Hover 之后会展示具体的时间，也可以通过纵轴的虚线确定该时间点之前的具体任务。因为 FP, FCP 等时间点有可能相同，为了展示效果，相同的时间点的指标会往后顺序渲染，具体时间点以虚线所在的时间或者 Hover 元素之后展示的 timestamp 为准。

![img](/lab/report-long-task-hover-0.png)

**通过找出 FMP/TTI 等关键时间点前的 Longtask 并加以优化是非常有效的性能优化手段。**

## Assets

> 记录了 Snapshot 运行期间的网络请求信息

![img](/lab/report-asset.png)

### 1. 资源详情过滤

按关键时间点过滤，能快速的找到关键时间点(FCP/FMP/LCP/TTI) 之前的资源加载情况。

### 2. 过滤可以优化的请求

根据是否正确开启 Gzip，是否正确开启缓存，资源体积大小，请求时间等规则，过滤出可以进一步优化的请求。

### 3. 请求详情

表格每一列的表头都可以点击来切换排序。默认按照 startTime 进行排序。
表格中每一列代表的信息与 Chrome devtool 中对应相同名称的信息相同。
表格每一行的请求信息都可以点击展开，展开后可以看到这个请求具体的 Timing/Request headers/Response headers 等信息

![img](/lab/report-asset-header.png)

## Flamechart

> Flamechart 功能需要 Snapshot 设置版本后才会显示：[如何设置 Lab 版本](./set-commit) 。

将 Lab 运行期间浏览器详细的运行过程以火焰图形式可视化展示出来。关于火焰图可以参考 [如何阅读与使用火焰图](../source/flamechart) 。

火焰图包含三个部分信息

- Network: 网络请求信息
- Tasks: 浏览器自身任务的执行信息，如计算样式，渲染等
- Main: JS 主线程的执行信息

![img](/lab/report-flamechart.png)

## Treemap

> Treemap 功能需要 Snapshot 设置版本后才会显示：[如何设置 Lab 版本](./set-commit)。

可视化展示了 Lab 运行过程中页面上 JS 代码覆盖率情况。图中红色阴影部分是下载了但没有运行过的 JS 代码。

![img](/lab/report-treemap.png)

## Analysis Report

基于 lighthouse 提供了 Performance \ Accessibility \ Best Practices \ SEO \ Progressive 相关的分数以及有哪些性能规则通过/未通过测试，可以清楚地看到需要优化的地方。

![img](/lab/report-performance.png)
