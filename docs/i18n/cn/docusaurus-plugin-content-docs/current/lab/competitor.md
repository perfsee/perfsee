---
sidebar_position: 4
---

# 如何使用竞品分析功能

通过对比站点性能和竞品性能，可以了解到自己站点之于竞品的性能瓶颈，包括性能分、关键指标、请求数量等的比较，从而进行优化和提升。

Competitor 功能是基于 Lab 功能的基础能力进行开发的，如果需要指标的详细解读可点击：[Lab 功能手册](./report)

## 使用步骤：

### 1. 新建竞品页面

进入 Settings -> Pages 进行竞品页面的新建。

1. 点击 Create 按钮新建页面；
2. 勾选 As competitor 作为竞品页面；
3. 将该竞品页面与需要比较的站点页面进行关联。

![img](/settings/create-competitor-page.png)

### 2. 手动触发扫描

在顶部导航栏选择 Lab 模块，进入 Lab 模块后点击列表右上方的 `Take a snapshot` 按钮可以手动触发一次扫描。

点击之后出现弹窗，勾选刚才关联了竞品页面的站点页面，点击保存。

![img](/lab/take-snapshot.png)

将会根据配置触发该页面以及该页面关联的竞品页面的扫描。

![img](/lab/take-snapshot-detail.png)

### 3. 查看竞品分析结果

在顶部导航栏选择 Competitor 模块，可以清晰的看到页面性能分数的对比和趋势变化。竞品分析的数据来源于 Lab 模块的手动触发或者定时任务触发。

![img](/lab/competitor.png)

1. 左上角的三个选择器可以根据 profile/page/environment 进行数据切换。站点页面选择器的选项为有对应竞品页面的站点页面。
2. 可以选择需要分析的时间跨度，默认为 15 天。
3. 点击 Competitor Report 可进入更详细的性能分析对比报告，里面的报告使用的数据是时间选择器选择的时间跨度内最新的一份数据进行对比。
4. 该表格里的所有分数为该时间跨度内所有的有效数据的平均分，± 后面的百分数指的是相对误差范围，计算方法是使用所有样本的误差范围除以平均数，表达了统计结果中的随机波动的大小。
5. 选择需要分析的数据指标可以看到对应指标的变化趋势，默认为 Lighthouse Performance Score。

### 4. 详细的竞品分析报告

#### Overview

列出站点页面和竞品页面的一些属性和指标的对比。绿色表示性能更优。

![img](/lab/competitor-detail-0.png)

![img](/lab/competitor-detail-1.png)

#### Breakdown

![img](/lab/competitor-detail-2.png)
