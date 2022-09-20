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

### Headers

设置自定义的 Headers
Set custom headers for the environment.

![environment headers](/settings/environment-headers.png)

1. **Apply to page load** This header would only be added to the first request of the page.
2. **Apply to all request** This header would be added to all requests.
3. You can input **any host**, and the corresponding header would be added to the matched host.

![environment header host](/settings/environment-header-host.png)
