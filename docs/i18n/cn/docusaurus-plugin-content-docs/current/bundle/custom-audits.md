---
id: custom-audits
title: 自定义审计规则
sidebar_position: 5
---

## 指定生效的审计规则

Perfsee 默认会应用所有[打包产物审计](./bundle-audits)中列出的审计规则，如果你只想应用某些审计规则，你可以通过指定 `rules` 参数来实现：

```ts
{
  plugins: [
    new PerfseePlugin({
      rules: ['large-assets', 'mix-content-assets'],
    }),
  ]
}
```

## 自定义审计规则

Perfsee 提供了**扩展**系统来支持各类自定义审计规则。

用户可以将自定义的产物分析审计规则（或者未来会支持的快照分析审计规则）上传到平台上，供自己或其他用户使用。

点击页面底部的 `Extensions` 按钮，你可以看到所有可用的自定义审计规则。

![extensions](/bundle/extensions.png)

以上图为例，有两个自定义审计规则 `custom-audit-1` 和 `custom-audit-2`，右侧则是这两个审计规则的说明。如果你想新增这两个审计规则到你的产物分析结果上，只需要按照如下设置：

```ts
{
  plugins: [
    new PerfseePlugin({
      // 'default' 表示所有默认的审计规则
      rules: ['default', 'custom-audit-1', 'custom-audit-2'],
    }),
  ]
}
```

## 如何上传自定义审计规则

上传审计规则到平台，需要按照以下步骤进行：

#### 1. 编写你的审计规则并在本地测试

```ts
const { yourOwnAudit } from 'your-own-audit'
{
  plugins: [
    new PerfseePlugin({
      rules: [yourOwnAudit], // yourOwnAudit 是一个类型为 `Audit` 的值
      enableAudit: true, // 将 enableAudit 设置为 true 以开启本地分析
    })
  ]
}
```

如果运行成功，你会在本地报告中看到这个审计规则的结果。

:::note
由于安全原因，当审计规则脚本上传至平台后，会在一个虚拟环境中运行。 这是一个纯的 js 运行环境，所以你无法 require 到任何 nodejs 基础库的内容（例如 `fs` 或 `path`）。

不过我们提供了 `getAssetSource` 全局方法来获取文件源码

```js
const Audit = ({ assets }) => {
  for (const asset of assets) {
    const source = await getAssetSource(asset.name)
  }

  return {
    // ...
  }
}
```

除此之外，我们限制了虚拟环境的内存 512 MB 以及运行超时时间 10 秒。超过限制的执行将会被 kill 掉。
:::

#### 2. Fork Perfsee 的仓库

#### 3. 将你的审计规则的代码放入 `packages/bundle-analyzer/src/stats-parser/audit/__extensions__/audit.ts`

**确保你的审计规则是默认导出项**.

如果你的审计规则引用了任何第三方依赖，请在 `packages/bundle-analyzer/package.json` 中添加并运行 `yarn install`

#### 4. 在 `packages/bundle-analyzer/src/stats-parser/audit/__extensions__/package.json` 中编辑 audit 的名字，描述以及版本号

#### 5. 将代码推至远端，联系 Perfsee 管理员上传至平台.
