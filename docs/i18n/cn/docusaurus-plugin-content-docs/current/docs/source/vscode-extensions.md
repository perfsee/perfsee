---
sidebar_position: 3
---

# VSCode 插件

## 安装

TODO: 扩展上架后更新

## 使用

安装完成之后，VSCode 侧边栏会出现 Perfsee 图标，点击图标可以看到 `Projects` `、Issues` 、 `Performance` 三个栏目。

![Perfsee 图标](/source/vscode-icon.png)

`Projects`：显示当前 VSCode 打开的项目，插件会根据本地的 Git 信息，自动分析项目的 ID、目录、分支和 Commit 信息。也可以手动设置。

`Issues`：显示当前项目中分析到的性能问题。

`Performance`:  显示目录中每个文件和文件夹的总运行时间，较慢的文件和文件夹会红色显示。

### Codelens

在 VSCode 编辑器界面中，插件会自动扫描当前文件中的性能数据，显示在对应代码后面，达到如下的效果。

![codelens](/source/vscode-codelens.png)

### 文件跳转

在左侧 Performance 栏目中选择想要查看的函数信息，点击之后会自动跳转至对应的文件及函数定义位置。

<video src={require('/source/vscode-performance-to-file.mp4').default} controls width="100%" />

### 查看火焰图

在代码中每个执行过的函数都会显示执行时间，点击执行时间弹出 Lab 扫描页面信息。

<video src={require('/source/vscode-choose-snapshot.mp4').default} controls width="100%" />

> 这里的火焰图操作方式与 Perfsee 平台火焰图操作方式一致

### 火焰图与文件跳转

在火焰图中可以和编辑器界面互相跳转。单击选择火焰图中的一段函数调用，在界面下方出现的调用栈中点击右边的蓝色文件图标可以跳转到对应的源码位置。

<video src={require('/source/vscode-flamechart-goto-file.mp4').default} controls width="100%" />
