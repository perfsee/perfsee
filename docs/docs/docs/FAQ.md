---
sidebar_position: 7
---

# FAQ

## Common

### Task stuck in Pending status for long time?

The analysis tasks on our platform are pushed in an FIFO queue and executed if an worker is available. It may take a some time to wait a worker in busy period. You can view the current status of task queue by accessing the **Status** of platform.

## Bundle

### Syntax error in while using plugins?

Only support node version >= **12**

### How the baseline of bundle analysis get chosen?

Baseline pickup rule follows the [Bundle Baseline branch](./settings/basic-setting#Bundle-baseline-Branch) setting, which is `master` by default and you can update it to any branch name or Regular Expression, `^v(\d+\.\d+\.\d+)$` for example.

It base on the `Bundle Baseline Branch` setting in project settings. It default to be `master` branch, if you want to change you can go to project settings.

### How do I know whether I successfully upload SourceMap with bundle?

We provide a `Notice` level bundle audit called `Missing sourcemap for js assets` which will tell you whether the SourceMaps are uploaded successfully.

If you see this result in the bundle audit, it means we didn't find any correspoding SourceMap for the js assets.

![audit sourcemap](/faq/audit-sourcemap.png)

## Lab

### How to compare multiple reports?

[Comparing multiple reports](./lab/multi-reports).

### How to test the page that need login?

Configure Cookies or Headers to authenticate logins in the project's [Environment Settings](./settings/environment-setting).

### How the performance score calculated?

[Performance Scoring](https://web.dev/performance-scoring/)

### Resource loading time is too long, is there network delay?

1. First of all, Lab runs in the standard environment, even if there is network delay, it's uncontrollable. So we suggest you to trigger the task again to check the result.
2. If the abnormal resource is in CDN, check if the resource hit cache.
3. If it is API request, please check your own logic and monitor.

## Source

### Plugin is realtime scanning when using it, so will it affect the coding efficiency.

No, VSCode plugin system promise to isolate the plugin and editor running in different processes, so the plugin won't cause any crash or delay.

If you feel there are too many performance information in codes and make some interference to coding, you can click the Performance button in the status bar to disable the performance information.

![vscode plugin disable](/faq/vscode-plugin-disable.png)

### Plugin shows “missing commit in local”

![vscode plugin missing commit](/faq/vscode-plugin-missing-commit.png)

It is because the plugin doesn't find the commit in local, which is usually because the local git repository is not updated. You can run `git fetch` to fix it. Missing commit won't affect the plugin and only few features need to read commit.

### No date after install the plugin

Ensure the project opened in VSCode has the corresponding project in platform, and the project is correctly connected to Bundle and Lab modules. Lab module's scan will be triggered by publish platform, or you can manually set commit to Lab Snapshot.
