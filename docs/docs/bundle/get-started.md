---
id: get-started
title: Get Started
sidebar_position: 1
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

:::note
Bundle analysis plugin requires `node --version >= v12`
:::

## Step 1: Install the plugin

<Tabs>
<TabItem value="Webpack">

```bash
# or any package manager you are using, e.g. npm/pnpm
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
       * Your project ID on Perfsee platform.
       *
       * **Required if you want ot upload the build to Perfsee platform for further analysis.**
       */
      project: 'your-project-id',
      /**
       * Give a uniq name for the bundled artifact.
       *
       * This option will be very useful when there are multiple builds in a single commit(in single CI progress)
       *
       * Because the comparison with historical builds is based on `Entrypoint`, and if multiple builds
       * emit same entrypoint names, we can't detect which entrypoint is the correct one to be compared.
       *
       * e.g. `build-1/main` and `build-2/main` are more confusing then `landing/main` and `customers/main`.
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
# or any package manager you are using, e.g. npm/pnpm
yarn add @perfsee/esbuild -D
```

```js title="build.js"
const { PerfseePlugin } = require('@perfsee/esbuild')

require('esbuild').build({
  // ...
  plugins: [
    PerfseePlugin({
      /**
       * Your project ID on Perfsee platform.
       *
       * **Required if you want ot upload the build to Perfsee platform for further analysis.**
       */
      project: 'your-project-id',

      /**
       * Give a uniq name for the bundled artifact.
       *
       * This option will be very useful when there are multiple builds in a single commit(in single CI progress)
       *
       * Because the comparison with historical builds is based on `Entrypoint`, and if multiple builds
       * emit same entrypoint names, we can't detect which entrypoint is the correct one to be compared.
       *
       * e.g. `build-1/main` and `build-2/main` are more confusing then `landing/main` and `customers/main`.
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
# or any package manager you are using, e.g. npm/pnpm
yarn add @perfsee/rollup -D
```

```js title=" rollup.config.js"
const { PerfseePlugin } = require('@perfsee/rollup')

module.exports = {
  // ...
  plugins: [
    PerfseePlugin({
      /**
       * Your project ID on Perfsee platform.
       *
       * **Required if you want ot upload the build to Perfsee platform for further analysis.**
       */
      project: 'your-project-id',

      /**
       * Give a uniq name for the bundled artifact.
       *
       * This option will be very useful when there are multiple builds in a single commit(in single CI progress)
       *
       * Because the comparison with historical builds is based on `Entrypoint`, and if multiple builds
       * emit same entrypoint names, we can't detect which entrypoint is the correct one to be compared.
       *
       * e.g. `build-1/main` and `build-2/main` are more confusing then `landing/main` and `customers/main`.
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
More plugin options can be found in [Plugin Options](./plugin-options)
:::

## Step 2: Bundle and analyze

### Option 1: Upload artifacts to Perfsee platform for further analysis

By default, our plugin will collect bundle information after the build is completed, and upload them to Perfsee platform. The platform will immediately initiate an analysis task, and return a link to the report that can be viewed.

```bash
# Provide PERFSEE_TOKEN environment variable for authentication
export PERFSEE_TOKEN=<your token>

# Bundle
run your-build-script
```

:::note
Go to [API](../api) to learn how to generate Perfsee Token.
:::

### Option 2: Analyze in CI

If you don't want to upload the bundles to Perfsee platform for further analysis, you can tell that to Perfsee plugin with the `PERFSEE_NO_UPLOAD` environment variable.

:::note
We strongly recommend uploading the artifacts to the platform for analysis.

The benefits would be, we will record every detail of your builds, including date, result, log and environment, which are all used to do better analysis. We will also use the historical data as a baseline to be compared with the latest commit, so we could find the potential performance impact in time.

Besides, some other features of our platform require the build data as well. The leaking builds data may cause those features unavailable.
:::

```bash
# Tell the plugin not to upload artifacts
export PERFSEE_NO_UPLOAD=true

# Bundle
run your-build-script
```

### Option 3: Analyze locally

If you want to analyze the bundles locally, you can set the `enableAudit` option to `true` or provide the `PERFSEE_AUDIT` environment variable.

:::caution
The bundles analyzed locally will **never** be uploaded to Perfsee platform.
:::

<Tabs>
<TabItem value="Config">

```js title="config"
PerfseePlugin({
  /**
   * Enable analysis and audit right after bundle emitted.
   *
   * With this option being `true`, perfsee will output bundle analyzed result in-place in CI workflow,
   * or start a server which serves html report viewer in non-CI environment.
   *
   * It would slow down the progress if enabled.
   *
   * @environment `PERFSEE_AUDIT`
   *
   * @default false
   * @default true // "in CI environment"
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

Execute the build command, and the plugin will start a server that serves the report viewer on your local machine.

## Step 3: View the report

If you choose to upload the bundles to Perfsee platform for analysis, we will automatically generate a report link and comment it on the corresponding PR or Commit Checks after the upload is completed. For more details about the report, please refer to [Report Details](./bundle-report).

If you choose to analyze locally, the plugin will start a server on [`http://localhost:8080`](http://localhost:8080) after the analysis is completed, and you can view the analysis result in the browser.

If you choose to analyze in CI, the analysis result will only be displayed as job log in the corresponding CI system.
