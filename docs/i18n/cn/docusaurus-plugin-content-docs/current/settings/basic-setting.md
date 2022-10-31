---
sidebar_position: 1
---

# 基础设置

:::info

仅项目 owner 有权限修改项目设置

:::

进入项目，点击侧边栏 `Settings` tab 进入设置页面。

![Basic setting route](/settings/basic-setting-route.png)

如上图所示，基本设置包含如下几个设置选项：

## 项目名称

无需解释

## 项目管理者（Owners）

无需解释

## 授权应用

项目当前授权的应用列表，可以在此添加、修改或新增授权应用。

## Bundle 对比基准分支设置

Bundle 分析时会将该分支作为基准分支与当前分支进行对比。

可以填写正则以匹配一系列分支名称，例如：`/rc-*/`

## 通知设置

平台会在任务结束之后，通过飞书机器人，发送相应的推送通知。为了提高消息触达效率，减少噪音，各项目管理员可以通过详细的设定，选择最合适的通知方式，甚至关闭所有通知。

### Notification Target Type (通知接收人设置）

- Issuer: 此选项会将通知发送给触发任务的人。
- Specified：填入邮箱设置一个或多个消息接收人。

![specified notification target](/settings/specified-notification-target.png)

### Bundle Notification Filter (Bundle 通知过滤设置）

可选项为:

- All: 接收包括任务完成，失败，警告等所有通知
- Only Warnings：仅接收警告及失败通知
- Mute All：关闭所有通知功能

### Bundle Notification Source (Bundle 通知任务来源设置）

部分项目有监控重点分支或者不需要所有开发分支都进行性能检测的需求，我们提供了对应的设置。

- All: 监控所有分支并发送通知
- Specific Branches: 仅监控指定分支并发送通知，勾选后更新表单，增加分支填写控件

![specific branch notification](/settings/specific-branch-notification.png)

### Lab Notification Filter (Lab 通知过滤设置)

可选项为:

- All: 接收包括任务完成，失败，警告等所有通知
- Mute All：关闭所有通知功能
