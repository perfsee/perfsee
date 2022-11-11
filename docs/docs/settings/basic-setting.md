---
sidebar_position: 1
---

# Basic Setting

:::info

Only project owner has permission to modify settings

:::

Go to your project, click `Settings` tab in sidebar and enter settings page.

![Basic setting route](/settings/basic-setting-route.png)

As it shows above, the basic settings include the following options.

## Project name

Nothing.

## Applications

The application authorized by this project. You can modify, delete or add new authorized application here.

## Bundle baseline Branch

In bundle analyze, this branch will be set to base branch and current branch will be compared.

Regex patten is supported, and the branch name will be matched with the pattern, for example: `/rc-*/`

## Notification Settings

We will notify users when the task is finished. You can set the notification settings here.

Project owners could choose most suitable notification method for project, even you can close all notifications so that you can receive the notification you need.

### Notification Target Type

- Issuer: This option will send notification to the person who triggers the task.
- Specified: Fill in the email address to set one or more receivers.

![specified notification target](/settings/specified-notification-target.png)

### Bundle Notification Filter

Options:

- All: Receive all notifications including task finished, failed, warning, etc.
- Only Warnings：Only receive warning and failed notifications
- Mute All：Close all notifications

### Bundle Notification Source

Some project need to monitor some important branches, or you don't care about all branched. We provide this setting for you.

- All: Monitor all branches and send notification
- Specific Branched: Only monitor specific branched and send notification, if checked, new input for branches will be shown.

![specific branch notification](/settings/specific-branch-notification.png)

### Lab Notification Filter

Options:

- All: Receive all notifications including task finished, failed, warning, etc.
- Mute All: Close all notifications

### Automatically detect version in lab(Beta)

Analyze which version of artifact is running from the lab data.

## Permission

![permission](/settings/permission.png)
