---
sidebar_position: 1
---

# 从 0 开始的 Source 分析流程

Source 功能在**同时接入** Bundle 与 Lab 模块后自动开启，无需额外操作。需要保证打包产物正确输出 `SourceMaps`。

> SourceMaps 用于将分析出的运行时性能数据还原到定位到源代码，这将有利于我们的编辑器插件帮助在开发阶段展示性能数据。
> 如果想要使用完整的 Source 功能，请务必配置打包产出正确的 SourceMaps
