---
id: package-report
title: Package Report
sidebar_position: 2
---

# Package Report

![overview](/package/overview.png)

## Overview

`Overview` shows you the details of your builds of a package.

### Bundle Size

![bundle-size](/package/bundle-size.png)
The minified/minified + gzip size of your package's main entrypoint after bundling by webpack.

The default minifier is esbuild.

### Download Time

![download-time](/package/download-time.png)
Your package's download time ignoring HTTP request latency.

### Composition

![composition](/package/composition.png)
The composision represents the contribution made by dependencies to your package. These sizes may be different from the dependencies' standalone sizes.

### Gzip Sizes Of Individual Exports

![exports](/package/exports.png)
This chart shows sizes of every export item of your package.

Note: Exports analysis is available only for packages that export ES Modules and are side-effect free.

## Benchmark

![benchmark](/package/benchmark.png)
Benchmark tab shows the result of all benchmark files under your project.

### Flame Graph

![benchmark-flamegraph](/package/benchmark-flamegraph.png)
During benchmarks running, we collected cpu profiling data to draw the flame graph.

You can locate the call stack of a specific benchmark case by clicking the case name on the table above.

You can enable the `left-heavy` mode to see the aggregated call stack. Its easier to find functions const longer time.

## Dependencies

![dependencies](/package/dependencies.png)
The dependencies tab shows all dependencies of your package.
