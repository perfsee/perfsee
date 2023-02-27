---
id: bundle-audits
title: Bundle Audits
sidebar_position: 3
---

## Introduction

When analyzing frontend project bundles, Perfsee will ship a performance score of them. The score is calculated in the form of several audit rules with different weights, and we will also
emit warnings if any of these rules auditing doesn't pass the threshold we predefined.

### Bundle Scoring

TLDR; `SUM(Score of rule * Weight of rule) / SUM(Weight of rules)`.

:::note
For those builds with multiple entry points shipped, the final score would be the average value of all entry points' scores.
:::

## Rules

### Large synchronous composable assets

`Why`: Large synchronous composable(JS/CSS/HTML) files can significantly increase the loading time of a page. by splitting unnecessary first screen loading resources, you can achieve high optimization benefits. This can be done with Webpack's [split chunks configuration](https://web.dev/reduce-javascript-payloads-with-code-splitting/) and lazy load.

`Judge`: file size(before compression) > 200 KB

`Scoring`: 1 - total size of large assets / total size of composable assets

`Absolute threshold`: score < 0.75

`Relative threshold(w/ baseline)`: score < baseline score - 0.1

`Weight`: 20

### Large initial third-party libraries

`Why`: Large third-party dependencies can increase the loading time and execution time. You can choose a smaller replacement for the same function to reduce the size or load it on demand (lazy load) only when it is truly needed.

`Judge`: total size of one package present in the bundles > 100 KB

`Scoring`: 1 - total hit size / total dependencies size

`Absolute threshold`: score < 0.9

`Relative threshold(w/ baseline)`: score < baseline score - 0.1

`Weight`: 10

### Unhealthy third-party libraries

`Why`: Unhealthy third-party dependencies will be hit by this rule. Like: oversized and known fully functional alternatives, dependencies that should not be present (process/fs/path, etc.), and additional configuration required to achieve optimal usage.

`Judge`: Hit the table

`Scoring`: 1 / log2(count of unhealthy libs + 2)

`Absolute threshold`: score < 0.5 (tolerance for 3 libs)

`Relative threshold(w/ baseline)`: score < baseline score

`Weight`: 5

### Duplicate third-party libraries

`Why`: A dependency that appears in the bundle with different versions of the same dependency or different dependencies but with the same functionality. For example, there are two versions of `lodash (@1.1.0, @2.0.0)`, or `momentjs`, `dayjs` or `date-fns` at the same time.

`Judge`: is duplicated

`Scoring`: 1 / log2(count of duplicated libs + 2)

`Absolute threshold`: score < 0.4(tolerance for 4 libs)

`Relative threshold(w/ baseline)`: score < baseline score

`Weight`: 20

### Mixed content

`Why`: Files that are mixed with source code and third-party dependent code. These files can also affect the result of cache invalidation. These files need to be marked because, during project iterations, third-party dependencies are often updated differently than the project code. This results, in a new release, where a third-party dependency is bundled in a file with the source code even though it has not been updated. So a new file is generated and users need to repeatedly download third-party dependencies that have not been updated. [Learn more](https://web.dev/use-long-term-caching/).

`Judge`: contains both source code and third-party dependencies

`Scoring`: 1 / log2(count of mixed content files + 2)

`Absolute threshold`: score < 0.5（tolerance for 3 files）

`Relative threshold(w/ baseline)`: score < baseline score

`Weight`: 20

### Non-minified assets(JS/CSS/HTML only)

`Why`: uglify to reduce the size of the bundle

`Judge`: bundle contains non-minified assets

`Scoring`: yes - 0; no - 1

`Absolute threshold`: score < 1

`Relative threshold(w/ baseline)`: score < 1

`Weight`: 20

### CDN preconnect/DNS prefetch

`Why`: In a poor network environment, establishing connections usually takes longer, especially for establishing secure connections. There are multiple steps, such as DNS lookups, redirects, etc., before the service can actually respond to user requests. Bringing these steps forward (without adding resolution/bandwidth overhead) allows users to experience faster page loads. [Learn more](https://web.dev/uses-rel-preconnect/).

`Judge`: all resource link origins are preconnect/dns-prefetch

`Scoring`: yes - 1; no - 0

`Absolute threshold`: score < 1

`Relative threshold(w/ baseline)`: score < 1

`Weight`: 5

### Large synchronous decomposable assets

`Why`: Large synchronous decomposable assets (fonts/images/videos) can significantly increase the loading time of the page, use smaller resources or use better compression/encoding algorithms instead.

`Judge`: file size > 200 KB

`Scoring`:

1 - total size of large assets / total size of composable assets

`Absolute threshold`: score < 0.75

`Relative threshold(w/ baseline)`: score < baseline score - 0.1

`Weight`: 0

### Cache invalidation

`Why`: The part of the static resource generated in the second of two releases that cannot be reused. In other words, in version 1.0, the user downloaded and cached the static resources, but due to the changes in version 1.1, the generated static resources have changed, and some static resources did not hit the previous cache and need to be downloaded again.

`Judge`: is new file

`Scoring`: 1 - new files sizes / total file sizes in baseline

`Absolute threshold`: score < 0.75 (tolerance for 25% invalidation)

`Relative threshold(w/ baseline)`: score < baseline score - 0.1

`Weight`: 0

### Uncontrolled third-party libraries

`Why`: Some packaging tools resolve runtime dependencies to versions that are not installed by the project, which can lead to dependency versions that are not controlled by the lock file (yarn.lock/package-lock.json), resulting in problems with multiple versions of dependencies and version incompatibility. For example, we found 4 different versions of react-dom in the bundled result of a project.

`Judge`: any libs that do not exist in projects node_modules by packed in bundles.

`Scoring`: yes - 0; no - 1

`Absolute threshold`: score < 1

`Relative threshold(w/ baseline)`: score < 1

`Weight`: 0
