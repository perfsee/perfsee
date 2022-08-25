---
id: bundle-report
title: Bundle Report
sidebar_position: 2
---

# Bundle Report

![overview](/bundle/overview.png)

In general, `Bundle Report` shows you the details of your builds from several aspects, from assets to third-party libraries and so on. All such information is very useful as a reference when doing optimization.

## Terms

There are some terms that should be introduced before start reading the report.

### Entry Points

Some bundle tools like `Webpack` allow us to configure multiple [Entry Points](https://webpack.js.org/concepts/entry-points/), and they are always treated(bundled) separately, so when we analyze the builds, we isolate entry points as well to achieve the most accurate result. If your project has multiple entry points, you can choose them through the dropdown list at the very top of the report.

### Baseline

Perfsee doesn't only analyze your every single build, but also compares them with **baselines** and shows you what has changed in between, for example, the assets size and libraries used.

Perfsee will always choose the built from the latest release branch as the baseline, which is `master` by default and you can change it in [Basic Settings](../settings/basic-setting) according to your project convention.

### Diff

After selecting an entry point, the diff result of that entry with the same one in the baseline will be calculated, including the total assets size, initial js size, cache invalidation and such.

A popup will show up with more details after you hover on any of the size numbers.

![hover-size](/bundle/hover.png)

> In the picture above, Gzip compressed size is calculated with level 4, and the brotli compressed size is calculated with default options. [reference](https://nodejs.org/docs/latest-v12.x/api/zlib.html#zlib_zlib). There might be some difference on the size with the one users actually download, but won't be much.

### Cache Invalidation

When building the frontend project, we always configure the tools to ship assets with `hash` in the files name and upload them to the CDN so we could safely assign them a long cache expiration time.

Generally speaking, the data used to generate the hash is always the content of each file(so-called content hash), which means once the content of the file changes, the hash will change as well. In this way, users will always download the new files so that no catch can be hit.

## Report content

> The numbers in the pictures below are the same with the following capther numbers.

![report](/bundle/report.png)

### 1. Entry Points

You can select and view the detail of each entry point in this dropdown.

### 2. Change Baseline

It's free for you to choose any other build as the comparison baseline. A popup will show up and list all available builds.

![select-baseline](/bundle/select-baseline.png)

:::note
Keep in mind that the baseline is chosen and frozen once after the build gets uploaded, so selecting another baseline to be compared here just changes the frontend diff result.
:::

### 3. Basic information

The basic information of the current build and baseline, including build date, commit hash, branch and so on.

### 4. Bundle Score

We have several predefined audit rules to calculate a score for each build. Check out [Bundle Audits](./bundle-audits) to see the rules and how we do the calculation.

### 5. Bundle Overview

Shows the total size of all asset files in this entry point and also the shares of each type.

### 6. Initial JS Size

Not all the JS files will be downloaded on the first screen. Big projects always prefer delaying some modules downloading to improve the first screen experience.

![initial-js](/bundle/card-hover.png)

### 7. Initial CSS Size

Ditto

### 8. Cache Invalidation

The total size of the cache invalidated assets.

### 9. Packages Count

Total count of packages included in emitted assets.

Except for the packages imported by source code directly, like `React` or `Vue`, the packages indirectly imported count as well.

The [Packages Table](#Packages) shows more in detail.

:::note
The third-party packages results provided by Perfsee are those packages exactly bundled into the final assets. We don't collect them by scanning `node_modules` folder or reading `packages.lock/yarn.lock` file.
So this information provides a strong credential to optimize your bundle.
:::

### 10. Duplicated packages

Normally, bundle tools won't pack the same package more than once into final js, but if some of your dependencies import different versions of other dependencies, you may encounter this situation.

For instance, your source code directly depends on `foo@2.0` and `bar@1.0`, and at the same time, `bar@1.0` depend on `foo` as well but the semantic version set in its `package.json` is `foo@^1.0`. In this case, no matter what package manager you use, `foo@2.0` and `foo@^1.0` will be definitely resolved to different versions and both of them will exist in your bundle outputs.

We provided a list of duplicated packages with import paths of them for helping you debug such a problem.

![duplicated-packages](/bundle/duplicate-detail.png)

### 11. Bundle content in detail

We have 4 tabs with different tables or lists to show you great detail of your bundle. They are:

1. List of all files that users will download when visiting your pages
2. List of all packages that the files included and a lot more information
3. List of all applied audit rules and applicable optimization suggestions
4. Visualization of all modules and their references relationship

## Tabs

### Assets

![assets](/bundle/assets.png)

Columns：

| Name              | Description                                                           |
| ----------------- | --------------------------------------------------------------------- |
| Name              | relative name of files. relative to webpack output path configuration |
| New               | whether is a new file                                                 |
| Type              | Whether initial loaded file                                           |
| Size              | File size                                                             |
| Time              | Estimated file downloading time                                       |
| Included Packages | packages with sizes included in given file                            |

#### More Explanation

1. We use such speeds to calculate the estimated downloading time：

   - Slow 3G: 40 KB/s
   - Good 3g: 196 KB/s
   - Regular 4G: 1.5 MB/s
   - LTE 4G: 3 MB/s
   - wifi: 3.9 MB/s
   - cable: 5 MB/s

2. `Included Packages` will show you the size of the packages bundled in each file. These sizes are the actual sizes bundled in the file, not the size of the whole package.

   For instance, in the above picture, the total size of package `@fluentui/react` is `538KB`(which is available in [Packages Table](#Packages)), but file `npm-36cd78e3.753182e1.js` only contains `494 KB` of this package, which means the rest of that package is bundled into other files.

   Packages with `(concatenated)` before their names means they are processed by Webpack `Module Concatenation` feature,
   and merged into other modules, leading to we can't recognize the real used size of them.
   But be relaxed, it doesn't mean we calculate the wrong size number. The size is just appended to the other package's size, but the total number is correct.

![included-packages](/bundle/included-packages.png)

3. The reason why the comparison with baseline is not given here is that we think all the content updates of static resources will show up on the file name(with the hash of content), so the diff size of the file will either be 100% or 0%, which is non-sense to be shown.

### Packages

![packages](/bundle/packages-detail.png)

Columns:

| Name     | Description                                      |
| -------- | ------------------------------------------------ |
| Name     | Package name and it's version                    |
| Current  | Total size introduced in current version         |
| Baseline | Total size introduced in baseline version        |
| Type     | Loading type                                     |
| Issuers  | Those packages that import this one              |
| Notes    | Some hint, like Module Concatenation information |
| Trace    | Visualization of import trace                    |

#### Explanation

1. duplicated packages will show in relative paths, like `lodash@x` and `foo/node_modules/lodash@y`, the last `lodash` is imported by package `foo`.
2. The size of each package is the sum of sizes introduced in all assets in the current entry point, and it may not equal the size of all files in that package. For example, if you configure Webpack to use the `treeshaking` feature, the unused code with no side effects will be removed, and the size of the package will be smaller.
3. Loading type shows all the possible loading type of assets that contains this package. There is a hoverable effect showing files that contain this package and the size shares this package takes in them.
   ![package-shared](/bundle/package-shares.png)
4. Issuers show all the packages that import this package if there are. It's convenient to find the reason for bundling some unexpected packages.
5. Notes show some extra information that may not quite important for packages. Currently, there is only one note type, which is `Module Concatenation` information, and there might be more in the future.
   ![package-concatenation](/bundle/package-concatenation.png)
   > The size of some packages may be 0, which means code of those packages are all merged into other packages by `Module Concatenation` future, and we lost the track of their size.
6. The import trance show all import paths that lead to this package getting bundled.
   > 'A ----> B' means 'A import B'。

![package-trace](/bundle/package-trace.png)

### Audits

![audits](/bundle/audits.png)

See more detail in [Bundle Audits](./bundle-audits)

### Visualization

At the same time, we provided a visualization graph as [WebpackBundleAnalyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer) do so you can know the module references of your project better.

![visualization](/bundle/content.png)
