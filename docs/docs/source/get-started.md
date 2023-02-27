---
sidebar_position: 1
---

# Get Started

The Source Analysis feature is automatically enabled when you have both Bundle and Lab modules enabled, no extra setup is required.

But since the analysis process needs to restore the runtime call stack to the source code structure, there are two main prerequisites to correctly use the source code analysis capabilities:

## Commit Information

Commit information is the basis of source code analysis. We need to know which version of your code is running to find the corresponding bundle and provide data support for the following analysis.

The good news is that we are enabling an experimental feature that can automatically detect version information at runtime. Through a series of data matching, we can accurately find the corresponding Commit information. This experimental feature can be enabled in the project settings and we will gradually open it to all users when it's getting stable.

## SourceMap

You need to make sure that the bundle tool correctly outputs `SourceMaps`, which are the necessary data for the analysis process, and a complete SourceMap will also be beneficial to our editor plugin to help display performance data during development as well.
