---
sidebar_position: 2
---

# Page 设置

在分析站点性能的时候，需要对站点的入口进行管理。站点扫描的最小维度是 Page。所以平台的 Lab 相关设置都是围绕 Page 进行设计的。

如果是扫描的是处于登陆状态的页面，可以在对应的 Environment 设置对应的 cookie 和 header：[Environments 配置](./environment-setting)

:::warning

当 **删除** page 的时候，**所有** 使用该 page 生成的 snapshot report 也会被一并删除。

:::

可以管理所有的页面链接，修改链接名称，配置该页面对应的 Profiles 和 Environment。

![pages](/settings/pages.png)

## 普通页面

点击 「Create page」 创建。

![create page](/settings/create-page.png)

## 竞品页面/临时页面

竞品页面需要关联本站页面进行使用，创建之后并生成相关数据之后可以在 Competitor 路由底下看到对比的数据以及详细的对比报表。

临时页面是在手动触发临时 Snapshot 的时候自动创建的。

![create competitor page](/settings/create-competitor-page.png)
