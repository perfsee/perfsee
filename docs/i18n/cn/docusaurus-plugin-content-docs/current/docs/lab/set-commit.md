---
sidebar_position: 5
---

# 关联 Commit

Lab 中的 Treemap 和 Flamechart 功能需要联动 Lab 分析的数据与 Bundle 产物分析的数据才能使用。平台使用 git commit hash 关联 Lab 与 Bundle。每个 Snapshot 都可以设置一个 commit hash。

Lab 自动化流程触发的任务会自动设置 commit hash，如果通过手动或设置定时触发任务，也可以如下图所示手动设置。

![img](/lab/set-commit.png)

一个 snapshot 只能设置一次 commit hash，并且无法修改。设置完成后会运行分析，分析结果会有些延迟（10 秒左右）。
