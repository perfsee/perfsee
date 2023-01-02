---
sidebar_position: 1
---

# Basic Setting

:::info
Only project owner has permission to modify settings
:::

Go to your project, click the `Settings` tab in the sidebar and enter the settings page.

![Basic setting route](/settings/basic-setting-route.png)

As it is shown above, the basic settings include the following options.

## Bundle baseline Branch

In bundle analysis, this branch will be set to the base branch and the current branch will be compared.

Regex pattern is supported, and the branch name will be matched with the pattern, for example, `/release-*/`.

## Notification Settings

We will notify users when the task is finished. You can set the notification settings here.

Project owners could choose the most suitable notification method for the project, even you can close all notifications so that you can receive the notification you need.

### Notification Target Type

- Issuer: Send notifications to the person who triggers all the analysis tasks.
- Specified: No matter who triggers the tasks, all notifications should be sent to given receivers.

![specified notification target](/settings/specified-notification-target.png)

### Bundle Notification Filter

Options:

- All: Receive all notifications including tasks finished, failed, and warnings
- Only Warnings: Only receive warnings and failed notifications
- Mute All: No notification should be sent to users

### Bundle Notification Source

There are requirements that only some branches need to be monitored, or you don't care about all branches. We provide a convenient setting for you.

- All: Monitor all branches and send notification
- Specific Branched: Only monitor specific branches and notifications from such branches will be sent, if checked, new input for branches will be shown.

![specific branch notification](/settings/specific-branch-notification.png)

### Lab Notification Filter

Options:

- All: Receive all notifications including tasks finished, failed, and warnings.
- Mute All: Close all notifications

### Automatically detect version in Lab (Experimental)

Analyze which version of the artifact is running from the lab data.

## Permission

![permission](/settings/permission.png)
