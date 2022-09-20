---
title: Introduction
slug: /
---

# Perfsee

Perfsee is a performance analysis platform for all general web applications. By providing various tools like bundle analysis, page measuring and source code analysis to tell developers where the performance bottleneck might be and so as the way to do better optimization.

## Functions

### Bundle

The Bundle analysis system scans the project's bundles(from webpack/esbuild/rollup), compares it with the last build (baseline) in multiple dimensions, gives diff information about the bundle and its impact on performance, and also suggestions for optimization.

### Lab

The performance analysis of the Lab module is based on the use of headless browsers to run user-specified pages, and through the collection of runtime data, analysis and output of key performance metric scores, network request information, main thread JS/rendering/Longtask information for business parties reference and performance optimization.

### Source

The Source module reduces the analyzed runtime performance data to locate the source code, aggregates the analysis results with commit hash, filters them, and shows the function calls that do not pass the relevant rules, the time consumed, and the reasons. It can also be combined with the editor plugin to display source code performance data during the development phase.

### Competitor

The Competitor function is based on the Lab module. By comparing the site performance with the competitor's performance, you can understand the performance bottleneck of your site compared with the competitor, including the comparison of performance score, key indicators, number of requests, etc., so that you can optimize and improve.
