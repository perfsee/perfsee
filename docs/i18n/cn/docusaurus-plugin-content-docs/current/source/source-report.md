---
sidebar_position: 2
---

# 源码分析报告

## Source Issues 列表

在进入项目之后，可以点击侧边栏 `Source` 标签进入到源码分析页面

![顶部 Source 标签](/source/source-tab.png)

页面会以两栏方式展示数据，左侧为所选 Commit 函数执行时间审计结果，右侧为火焰图展示部分。默认会选择最新的 Commit。

![左右分栏界面](/source/source-overview.png)

可以点击左侧 `commit` 下拉框来选择关注的 commit.

![commit 下拉框](/source/commit-select.png)

选定 Commit 之后列表将会自动刷新，获取所选 Commit 源码分析出的问题[分析规则]并展示，每一行内容按列展示如下：

1. **Report** 对应于发现问题的 Lab 扫描报告
2. **Function** 问题函数名。展示的函数名为 `(anonymous)` 意指该函数为匿名函数，`() => {}` 或 `function() {}`
3. **File** 问题文件名（格式为 `文件名:行号:列号`）
4. **Time** 函数执行时间
5. **操作** 依次为 在火焰图中定位展示、跳转到对应 Commit

函数名与文件名可用于定位到源代码中函数精确位置。

![](/source/source-issue.png)

:::tip
若文件名过长，会被自动截断。Hover 到文件名时，会通过 tooltip 展示被截断的文件名，复制之后可以通过编辑器文件跳转功能（如 `VSCode` `cmd+p`）直接跳转到函数定义。
:::

## 火焰图

我们会在 `Lab` 运行过程中，会收集浏览器 `Profile` 信息用于绘制火焰图。为了提高火焰图的可读性，易于开发者理解调用链关系，我们会将火焰图中的调用栈信息悉数还原成真实的源码路径及函数名，这也就是为什么需要 `Webpack` 打包过程中输出生成正确的 `SourceMap` 的原因。

关于火焰图的阅读及优化技巧参考：[如何阅读与使用火焰图](./flamechart)

### 如何查看扫描所使用的火焰图？

点击问题列表中的火焰图按钮，即可加载对应的火焰图，并直接定位所选文件在火焰图中的位置

![定位所选文件](/source/show-in-flamechart.png)

![文件在火焰图中的位置](/source/flamechart.png)

火焰图分为上下两个部分，火焰图本体和调用栈。交互与 Chrome Devtool 中一致，可以使用鼠标滚轮缩放，点击拖拽。

调用栈会显示当前单击选中的函数的上层函数列表，点击可以跳转到对应位置。
