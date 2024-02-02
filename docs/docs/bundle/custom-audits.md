---
id: custom-audits
title: Custom Audits
sidebar_position: 5
---

## Specify Audits

By default, Perfsee will apply all audits listed in [Bundle Audits](./bundle-audits) to your bundles. If you want only specific rules to apply, you can use the `rules` option in the Perfsee plugin:

```ts
{
  plugins: [
    new PerfseePlugin({
      rules: ['large-assets', 'mix-content-assets'],
    }),
  ]
}
```

## Custom Audits

Before we talking about custom audits, we should introduce the `Extensions` system first.

The `Extensions` system is a place where users can upload their custom audits for bundle analysis (also lab anslysis in the future).

Click the `Extensions` button at the bottom of the page, you will see all avaliable custom audits in the list.

![extensions](/bundle/extensions.png)

For example, there are two custom audits `custom-audit-1` and `custom-audit-2`, you can see the descriptions on the right. If you want to append these two audits to your bundle, just simply set:

```ts
{
  plugins: [
    new PerfseePlugin({
      // the value 'default' represents all default audits
      rules: ['default', 'custom-audit-1', 'custom-audit-2'],
    }),
  ]
}
```

## How To Upload Your Own Audit

To upload your own audit to the Extensions system, please follow these steps:

#### 1. Write your own audit and test it locally

```ts
const { yourOwnAudit } from 'your-own-audit'
{
  plugins: [
    new PerfseePlugin({
      rules: [yourOwnAudit], // yourOwnAudit is a value of type `Audit`
      enableAudit: true, // set enableAudit to true to run bundle analysis locally
    })
  ]
}
```

If it executes successfully, you will see it in the local report.

:::note
For security reasons, after you upload your script, custom audits will be run in a `vm`, which is a pure javascript environment so that you cannot require anything from nodejs's strandard libraries like `fs` or `path`.

Fortunately, we provide a `getAssetSource` method to get the source of assets.

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

In addition, we limit the memory usage to 512MB and timeout to 10 secs. Executions exceeding the limit will be killed.
:::

#### 2. Fork the Perfsee repository

#### 3. Put your code into `packages/bundle-analyzer/src/stats-parser/audit/__extensions__/audit.ts`

**Make sure you are exporting your audit as default**.

If your audit requires any third part packages, add them in the `packages/bundle-analyzer/package.json` and run `yarn install`

#### 4. Edit `name`, `description`, `version` of your audit in `packages/bundle-analyzer/src/stats-parser/audit/__extensions__/package.json`

#### 5. Push your code and call the Perfsee admins to do the next.
