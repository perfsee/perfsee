---
sidebar_position: 3
---

# 开放 API

## 简介

Perfsee 提供的 Open API 是基于 `GraphQL` 实现，所以在开始使用前需要先了解 [GraphQL](https://graphql.org/) 的基本概念及语法。

API 的访问点端是 `https://perfsee.com/graphql`

:::caution

所有 API 共享频率限制为 120 次/分。部分任务触发类 API 为独立限制，具体结果以 Response header: `x-ratelimit-limit` 及 `x-ratelimit-remaining` 为准。

:::

## 鉴权

所有 API 皆需要鉴权，请在 [Token Management](https://perfsee.com/me/access-token) 页面申请 API Token。

点击 「Generate new token」

![generate new token](/api/generate-new-token.png)

输入 token 名称，不能与已有的 token 名称相同，点击 「Create」

![token generated](/api/token-generated.png)

:::caution

**注意，该弹窗仅会展示一次**，关闭后无法再次查看已经生成的 token 值，请在关闭弹窗前保存好 token。可以点击 「Copy」复制到剪贴板。

:::

## 发起请求

申请完 Token 之后，通过携带如下 Header 发起请求：

```
Authorization: Bearer {token}
```

### 例子

这里又一个使用 GraphQL playground 发起请求的例子:

![api example](/api/request.png)

:::caution

所有返回状态码非 **200** 的错误，均为 GraphQL 查询语法错误，请先自查。

:::

## 查看 API 接口

进入 [playground](https://perfsee.com/graphql) , 点击右侧 「DOCS」，展开后可以查看当前提供的所有 API
