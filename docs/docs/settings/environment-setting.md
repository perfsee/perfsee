---
sidebar_position: 4
---

# Environment Setting

Configure environment information, and if you need to test login status, you need to configure the cookie or header.

:::warning

When **delete** environment, **all** snapshot report created by this environment will be deleted as well.

:::

![environments](/settings/environments.png)

These environments will be used in Lab triggered by manual / scheduled / other platforms.

## Features

### Create Environment

Click the `Create environment` button, fill in the relevant information.

The environment can be used to connect with project's Page, and can be selected when trigger a scan by manual.

![create environment](/settings/create-environment.png)

### Create Competitor Environment

Same as above, and check the `Competitor environment` checkbox before saving.

Competitor environment can only be linked to competitor page and temporary page. And competitor page cannot be selected when trigger a scan by manual.

## Configurations

### Cookies

You can set the cookie for the environment for the following usage:

- Authorization validate
- Abandon advertisements to simplify the page for develops
- A/B test

#### Input type

Table mode is default, just input data according to the prompt. Click the button to switch to Stringify mode that can bulk create cookies.

##### Table

![](/settings/cookies-table.png)

##### Stringify

We don't have a convenient way to export cookies in Chrome, so we recommend installing [EditThisCookie](https://chrome.google.com/webstore/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbg) to export cookies.
![](/settings/cookies-stringify.png)

### Headers

Set custom headers for the environment.

![environment headers](/settings/environment-headers.png)

1. **Apply to page load** This header would only be added to the first request of the page.
2. **Apply to all request** This header would be added to all requests.
3. You can input **any host**, and the corresponding header would be added to the matched host.

![environment header host](/settings/environment-header-host.png)

#### Input type

Table mode is default, just input data according to the prompt. Click the button to switch to Stringify mode that can bulk create headers.

![](/settings/headers-stringify.png)

### React Profiling

:::caution Notice

This is an experimental feature which may be unstable in some circumstances. Please report an issue if it works unexpectedly.

It may slow down the rendering speed of pages.

:::
![](/settings/react-profiling.png)

By enabling this feature, timing information about each component that’s rendered in React applications will be collected during lab analysis.

Flamegraph will be shown in the snapshot report, which can help us to identify performance bottlenecks in React applications.

This feature is based on the use of React Profier API, which is disabled in the production build.
We solved this by intercepting the network request of `react-dom` and replace it with a profiling build.
