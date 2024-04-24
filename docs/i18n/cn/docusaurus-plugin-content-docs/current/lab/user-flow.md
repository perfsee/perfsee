---
sidebar_position: 5
---

# User flow 模式（原 e2e）

## 背景

传统的 Lab 模块测试只面向首屏性能，无法测试用户交互操作性能。

在做性能分析时，对于一些用户交互的性能指标，通常只能使用 Chrome Devtool 手动测量手动统计，所以需要一种能够自动测量页面交互性能并量化成性能指标的方法。

## 功能

- 支持运行用户提供的 Puppeteer 脚本，测试页面功能和用户交互性能。

- 集成 [Lighthouse User Flow](https://web.dev/lighthouse-user-flows/) 功能，衡量性能指标，分析页面性能问题，提供最佳实践建议。
- 专注于性能的分析，提供如火焰图，Treemap，Lighthouse 等性能分析工具。
- 结合 Source 功能，将性能问题定位到源码位置。

## 使用方法

### Step 0：添加运行环境

按照[从 0 开始的 Lab 分析流程](./get-started)中的步骤创建 Profile, Environment 和 Page。

### Step 1：在页面配置中开启 Userflow 模式

在目标页面配置下方勾选 `User Flow Mode`。

![enable-userflow](/settings/enable-userflow.png)

### Step 2：编写 User flow 脚本 （或使用 Chrome Devtools 录制）

本平台使用 [puppeteer](https://github.com/puppeteer/puppeteer) 来运行 user flow，user flow 脚本兼容大部分常用 puppeteer API。

#### 脚本环境

在运行 user flow 脚本前会预先创建 Puppeteer 实例，打开浏览器并创建标签页，并将平台上配置的 Profiles 和 Environments 自动注入到浏览器标签页中。标签页会被注入到脚本环境全局变量 `page` 中。 User flow 脚本只需要调用 `page` 上的方法即可对页面进行操作。更多方法请看 [puppeteer Page 类 API](https://pptr.dev/api/puppeteer.page)。

#### 示例

```javascript
await page.goto('https://a.b.c/')

// 点击 class 为 ms-List-cell 并且包含 main 的 div
const [project] = await page.$x("//div[contains(@class, 'ms-List-cell') and contains(., 'main')]")

await project.click()

// 等待页面跳转

await page.waitForNetworkIdle()
```

#### 使用 Chrome Devtools 录制脚本

一个更方便的方法是使用 Chrome devtools 来录制脚本

1. 打开目标页面，并打开 devltools.
2. 切换到 `Recorder` 标签，创建一个新的录制.
   ![Recorder](/lab/chrome-recorder.png)
3. 点击开始录制按钮之后，在目标页面上手动进行交互.
4. 录制完成后, 请点击 `Replay` 按钮检查生成的脚本是否按照预期运行。
5. 点击 show code 按钮，并将代码格式切换为 `Puppeteer`.
   ![recorded-script](/lab/recorded-script.png)
6. 将录制的代码直接拷贝到 Perfsee 页面 `user flow scrtip` 编辑器中.

#### User Flow

为了在运行时分析用户操作的性能指标，如每次跳转的耗时，每次点击的响应时间等，我们会将整个脚本分成若干个 Steps，每个 Step 都会产生性能指标。

在脚本中触发以下操作时自动开始一个 Step。

- goto
- reload
- goBack
- goForward
- click
- focus
- hover
- select
- tap
- type
- Mouse 类的全部方法
- Touchscreen 类的全部方法
- Keyboard 类的全部方法
- ElementHandle 类的 drag&drop 方法

如果你想把多个操作合并为一个 Step，如鼠标按下、移动、再松开模拟拖拽操作，需要使用全局对象 `flow` 上的 `startStep` 和 `endStep` 方法。

例如：

```javascript
await flow.startStep('<Step Name>')

await page.mouse.down()
await page.mouse.move(0, 100)
await page.mouse.move(100, 100)
await page.mouse.move(100, 0)
await page.mouse.move(0, 0)
await page.mouse.up()

await flow.endStep()
```

**page.goto 是特殊的 Step 不应该在 `flow.startStep` 和 `flow.endStep` 之间调用。**

### Step 3：触发一次 User flow 测试（手动）

在 Lab 模块中点击列表右上方的 `Take a snapshot` 按钮选择`Select existed pages`，选择刚刚创建的 User flow 页面，点击 `Save` 就可以手动触发一次扫描。

### Step 4：查看测试结果

在 Lab 模块点击刚刚触发的 Snapshot 卡片将会弹出该 Snapshot 中包含的所有运行结果，等待 Userflow 页面的 Status 变为 Completed 之后，点击进入结果页面。

![img](/lab/e2e-take-snapshot-detail.png)

#### User Flow 报告

在 Userflow 报告中可以看到每个 Step 的性能分析数据和优化建议。点击时间轴上的缩略图可以跳转到后一个 Step。

![img](/lab/e2e-report-userflow.png)
