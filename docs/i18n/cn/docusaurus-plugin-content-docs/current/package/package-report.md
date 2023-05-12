---
id: package-report
title: Package 分析报告
sidebar_position: 2
---

# Package 分析报告

![overview](/package/overview.png)

## Overview

`Overview` 展示了你的 package 的大小、引用模块、导出模块、历史数据等信息。

### Bundle Size

![bundle-size](/package/bundle-size.png)

Bundle Size 展示了你的 package 的主入口被 webpack 打包并 minify 压缩后所占用的体积。

默认的 minifier 为 esbuild。会分别展示 gzip 压缩前后的体积。

### Download Time

![download-time](/package/download-time.png)

Download Time 展示 3G 和 4G 网络下下载你的包的预估耗时（忽略 HTTP 请求延迟）。

### Composition

![composition](/package/composition.png)

Composition 展示了你的 package 总体积是由哪些依赖模块组成的，这些依赖模块组成的体积不同于依赖本身的大小。

### Gzip Sizes Of Individual Exports

![exports](/package/exports.png)

这个部分展示了你的 package 的所有导出项所占的体积。

注意：导出项的体积分析仅适用于导出了 ES modules 并标记 `sideEffect` 为 `false` 的 package。

## Benchmark

![benchmark](/package/benchmark.png)

Benchmark 页面展示了你的 package 项目下所有 benchamrk 文件的执行结果。

### Flame Graph

![benchmark-flamegraph](/package/benchmark-flamegraph.png)

在 Benchmark 运行过程中，我们收集了 CPU profiling 数据用以绘制火焰图。

你可以单击上面表格中的用例名来快速定位到对应的火焰图调用节点。

你可以开启 `left-heavy` 模式来查看聚合了相同用例调用栈的火焰图，这样可以更容易观察到哪个 function 耗时过长。

## Dependencies

![dependencies](/package/dependencies.png)

Dependencies 展示了你的 package 的所有依赖。
