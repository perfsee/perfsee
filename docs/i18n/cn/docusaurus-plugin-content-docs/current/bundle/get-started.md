---
id: get-started
title: 从 0 开始的打包产物分析流程
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

:::note
打包产物分析功能所需插件要求 `node >= v12`
:::

## Step 1：接入打包工具插件

<Tabs>
<TabItem value="Webpack">

```bash
# 或者任何你的项目使用的包管理工具，例如 npm/pnpm
yarn add @perfsee/webpack -D
```

```js title="webpack.config.js"
const { PerfseePlugin } = require('@perfsee/webpack')

module.exports = {
  // ...
  plugins: [
    // ...
    new PerfseePlugin({
      /**
       * Perfsee 平台对应的项目 ID。
       *
       * **如果想要上传打包产物到平台进行分析，则该选项必填。**
       */
      project: 'your-project-id',

      /**
       * 给打包的产物指定一个项目内唯一的名字。
       *
       * 在一次提交（单个 CI 工作流）中，如果有会构建多次，即有多个打包产物时会很有用。
       *
       * 因为我们和基准的对比是基于 `Entrypoint`，如果多次构建产生的打包产物的 `Entrypoint` 名字相同，我们无法确定哪个是正确的用来被对比的基准。
       *
       * 例如：`landing/main` 和 `customers/main` 很直接的告诉我们两份产物的区别，后续我们也可以用相同名字的产物进行对比。
       *
       * @default 'main'
       */
      artifactName: 'main',
    }),
    // ...
  ],
}
```

</TabItem>
<TabItem value="ESBuild">

```bash
# 或者任何你的项目使用的包管理工具，例如 npm/pnpm
yarn add @perfsee/esbuild -D
```

```js title="build.js"
const { PerfseePlugin } = require('@perfsee/esbuild')

require('esbuild').build({
  // ...
  plugins: [
    PerfseePlugin({
      /**
       * Perfsee 平台对应的项目 ID。
       *
       * **如果想要上传打包产物到平台进行分析，则该选项必填。**
       */
      project: 'your-project-id',

      /**
       * 给打包的产物指定一个项目内唯一的名字。
       *
       * 在一次提交（单个 CI 工作流）中，如果有会构建多次，即有多个打包产物时会很有用。
       *
       * 因为我们和基准的对比是基于 `Entrypoint`，如果多次构建产生的打包产物的 `Entrypoint` 名字相同，我们无法确定哪个是正确的用来被对比的基准。
       *
       * 例如：`landing/main` 和 `customers/main` 很直接的告诉我们两份产物的区别，后续我们也可以用相同名字的产物进行对比。
       *
       * @default 'main'
       */
      artifactName: 'main',
    }),
  ],
  // ...
})
```

</TabItem>
<TabItem value="Rollup">

```bash
# 或者任何你的项目使用的包管理工具，例如 npm/pnpm
yarn add @perfsee/rollup -D
```

```js title=" rollup.config.js"
const { PerfseePlugin } = require('@perfsee/rollup')

module.exports = {
  // ...
  plugins: [
    PerfseePlugin({
      /**
       * Perfsee 平台对应的项目 ID。
       *
       * **如果想要上传打包产物到平台进行分析，则该选项必填。**
       */
      project: 'your-project-id',

      /**
       * 给打包的产物指定一个项目内唯一的名字。
       *
       * 在一次提交（单个 CI 工作流）中，如果有会构建多次，即有多个打包产物时会很有用。
       *
       * 因为我们和基准的对比是基于 `Entrypoint`，如果多次构建产生的打包产物的 `Entrypoint` 名字相同，我们无法确定哪个是正确的用来被对比的基准。
       *
       * 例如：`landing/main` 和 `customers/main` 很直接的告诉我们两份产物的区别，后续我们也可以用相同名字的产物进行对比。
       *
       * @default 'main'
       */
      artifactName: 'main',
    }),
  ],
  // ...
}
```

</TabItem>

</Tabs>

:::note
更多插件选项在 [插件参数](./plugin-options) 中有详细说明
:::

## Step 2：打包并分析

### Option 1: 在 CI 中上传产物至平台分析

默认情况下，在打包完成后，我们的插件会自动收集产物信息，并将报告上传到 Perfsee 平台。平台会立即发起分析任务，并将可供查看报告链接返回。

```bash
# 提供 PERFSEE_TOKEN 环境变量，用于鉴权上传产物
export PERFSEE_TOKEN=<your token>

# 打包
run your-build-script
```

:::note
前往 [API](../development/api) 查看如何生成 Perfsee Token。
:::

### Option 2: 仅在 CI 中分析

如果你不希望将产物上传至 Perfsee 平台进行分析，我们也提供了这一选项。

:::note
我们强烈建议将产物上传至平台上进行分析。
上传至平台分析的好处是，我们会详细记录每一个构建的信息，包括构建时间、构建结果、构建日志、构建环境等，以便于更好的分析。我们也可以使用历史数据与新数据进行对比，及时发现打包中会导致性能劣化的问题。
平台其他功能也会使用到这些数据，数据缺失可能会导致其他功能不可用。
:::

```bash
# 告诉插件，不要上传产物
export PERFSEE_NO_UPLOAD=true

# 打包
run your-build-script
```

### Option 3: 在本地分析并查看报告

如果你希望在本地分析产物，只需要将插件参数 `enableAudit` 设置为 `true` 或提供环境变量 `PERFSEE_AUDIT=1`。

:::caution
在本地打包无法上传产物至 Perfsee 平台。
:::

<Tabs>
<TabItem value="Config">

```js title="config"
PerfseePlugin({
  /**
   * 是否在打包完成后启用分析和审计。
   *
   * 启用分析和审计后，perfsee 将会在 CI 工作流中输出分析结果，或者在非 CI 环境下启动一个服务，用于展示分析结果。
   *
   * **将会使打包速度变慢**
   *
   * @environment `PERFSEE_AUDIT`
   *
   * @default false
   * @default true // 在 CI 环境中
   */
  enableAudit: true,
  // other options...
})
```

</TabItem>

<TabItem value="Environment Variable">

```bash
export PERFSEE_AUDIT=true
```

</TabItem>
</Tabs>

完成设置后，执行打包命令即可。

## Step 3：查看报告

除了选择在 CI 中分析这种方式，我们都提供了可视化的报告展示。对于报告内容的详解，请参看：[报告详解](./bundle-report)。

如果采用了上传产物进行分析的方式，那么我们会在上传完成后，自动为你生成一个报告链接并以 Github 评论的方式，在对应的 PR 或 Commit Checks 中评论。

选择本地查看报告，插件将会在分析完成后在本地 [`http://localhost:8080`](http://localhost:8080) 启动一个服务，用于展示分析结果。

如果选择 CI 原地分析的话，那么分析结果将仅会在对应 CI 中以日志的形式展示。
