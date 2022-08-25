---
id: get-started
title: Get Started
sidebar_position: 1
---

:::note
Bundle analysis plugin requires `node --version >= v12`
:::

## Step 1：Install the plugin

```bash
# or any other package manager your project uses, like npm/pnpm
yarn add @perfsee/webpack -D

# or for other bundle tools
yarn add @perfsee/esbuild -D
yarn add @perfsee/rollup -D
yarn add @perfsee/speedy -D
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
       * Because the comparasion with historical builds is based on `Entrypoint`, and if multiple builds
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

:::note
Other plugin options are well documented in [options](./plugin-options)
:::

## Step 2：Build and Analyze

### Option 1: Uploading to Perfsee

By default, after the bundling progress, our plugin will automatically collect the required information and upload it to Perfsee platform. The platform will start the analysis job right after builds are received and return the link to the analyzed result to you.

```bash
# provide `PERFSEE_TOKEN` environment variable for uploading builds
export PERFSEE_TOKEN=<your token>

# pack
yarn build
```

:::note
Checkout [API](../../api) for how to generate the token.
:::

### Option 2: Analyze locally

If you don't want your built assets to be uploaded to Perfsee, we provide such an option as well.

:::note
We highly recommend uploading builds to Perfsee to analyze.

The benefits would be, we will record every detail of your builds, including date, result, log and environment, which are all used to do better analysis. We will also use the historical data as a baseline to be compared with the latest commit, so we could find the potential performance impact in time.

Besides, some other features of our platform require the builds data as well. The leaking builds data may cause those features unavailable.
:::

```bash
# tells the plugin, do not upload the builds
export PERFSEE_NO_UPLOAD=1

# pack
yarn build
```

## Step 3：View the report

If in Step 2, you choose to upload the builds to Perfsee, we will return you an URL to the final report, or in the form of a Github PR comment if exists. The bundle report in detail is explained here: [Bundle Report](./bundle-report).

If your choose to analyze locally, the result will only be shown in the CI logs.
