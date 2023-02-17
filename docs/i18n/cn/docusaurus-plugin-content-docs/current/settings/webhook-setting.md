---
sidebar_position: 6
---

# Webhook 设置

通过 Webhook，您可以在自己的服务器上接收来自 Perfsee 的事件通知，在将 Perfsee 与其他服务集成时非常有用。

## 创建 webhook

打开项目 -> `Settings` -> `Webhook` -> `Create`,

![create](/settings/create-webhook.png)

## 接收 Payload

当事件发生时，Perfsee 将向配置的 `url` 发送一个 `POST` 请求，并包含事件中涉及的数据。

以下代码演示了如何使用 `express` 构建一个简单的服务器来接收 Webhook 事件。

```js
const express = require('express')
const app = express()

app.post('/callback', express.json(), function (req, res) {
  switch (req.body.eventType) {
    case 'bundle-finished':
    //... your code here
  }
  res.status(204).send()
})

app.listen(3000)
```

> 当您的服务器收到一个 webhook 请求时，它应该尽快返回一个成功状态代码（>= 200 和 < 300）。 如果 30 秒内没有收到响应，perfsee 将重试请求。

## 验证 payloads

为确保 Webhook 请求来自 Perfsee 并防止其他人伪造请求，您还需要验证负载。

首先，您需要在 Webhook 设置中设置一个 `secret`，之后 Perfsee 发送的每个 Webhook 请求都将包含一个`X-Perfsee-Signature-256` 请求头。 其中包含请求 `body` 的 [HMAC](https://en.wikipedia.org/wiki/HMAC) 十六进制哈希，带有`sha256=`前缀，典型形式为`sha256=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`。

当您的服务器收到请求时，您可以使用 `secret` 和请求 `body` 生成摘要，并将其与请求头中提供的哈希进行比较以完成验证。

下面演示如何使用 `express` 进行验证。

```js
const express = require('express')
const crypto = require('crypto')
const app = express()

app.post('/callback', express.text({ type: '*/*' }), function (req, res) {
  const digest = crypto.createHmac('sha256', process.env.SECRET).update(req.body).digest('hex')
  if (req.header('X-Perfsee-Signature-256') === 'sha256=' + digest) {
    const data = JSON.parse(req.body)
    switch (data.eventType) {
      case 'bundle-finished':
      //... your code here
    }
    res.status(204).send()
  } else {
    res.status(400).send()
  }
})

app.listen(3000)
```

## TypeScript 定义

Webhook 的类型定义包含在 npm 包 `@perfsee/sdk` 中，用法如下。

```ts
import express from 'express'
import { WebhookEvent } from '@perfsee/sdk'

const app = express()

app.post('/callback', express.json(), function (req, res) {
  const json = req.body as WebhookEvent
  console.log(json)
})

app.listen(3001)
```

## POST 示例

Request:

```
Accept: */*
content-type: application/json
User-Agent: Perfsee-Hookshot/1
X-Perfsee-Delivery: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
X-Perfsee-Event: bundle-finished
X-Perfsee-Hook-ID: 1
X-Perfsee-Hook-Project: perfsee
X-Perfsee-Signature-256: sha256=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

{
  "eventType": "bundle:finished",
  "payload": {
    "data": {
      "project": {
        "id": "anything",
        "host": "Github",
        "namespace": "perfsee",
        "name": "perfsee",
        "isPublic": false,
        "artifact": {
          "id": 65,
          "branch": "feat/webhook",
          "name": "main",
          "hash": "50fae89df58f7e61431268470df5edebad4ba902",
          "status": "Passed",
          "duration": 5433,
          "failedReason": null,
          "buildKey": "builds/1/ad38f6ba-80a0-4d67-869b-8edbbfde0d81.tar",
          "reportKey": "artifacts/1/bundle-results/89540a83-d862-4652-bd8b-3fe338c3eb4e.json",
          "contentKey": "artifacts/1/bundle-content/4a5cbd9a-e04a-4b7f-a76d-0572cae28cab.json",
          "score": 57,
          "createdAt": "2022-12-18T23:12:04.076Z"
        }
      }
    },
    "variables": {
      "projectId": "anything",
      "artifactId": 65
    }
  }
}
```
