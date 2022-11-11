---
sidebar_position: 5
---

# 定时分析设置

平台提供 Lab 定时分析功能，需要在 `Settings > Schedule` 中开启，默认关闭。定时分析产生的 Snapshot 报表可在 Lab 模块进行查看，分数趋势图表可在项目首页查看。
每次定时分析任务，会扫描配置好的页面（或者所有页面），以及每个页面关联的竞品页面。

![schedule type](/settings/schedule-type.png)

- **Off** 关闭
- **Hourly** 每小时触发一次
- **Daily** 可以自定义每日触发 lab 扫描的时间

![schedule daily](/settings/schedule-daily.png)

- **EveryXHour** 每 x 小时运行一次，最多不超过 168 小时（7 天）

![schedule hour](/settings/schedule-x-hour.png)

可以配置需要定时分析的页面/Profile/环境，如果设置为 All，则会分析项目设置中的所有 Page。

![schedule pages](/settings/schedule.png)
