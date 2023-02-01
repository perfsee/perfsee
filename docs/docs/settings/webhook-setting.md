---
sidebar_position: 6
---

# Webhook Setting

With webhook you can receive event notifications from perfsee on your own server, which is very useful when integrating other services with perfsee.

## Create webhook

Open Project -> `Settings` -> `Webhook` -> `Create`,

![create](/settings/create-webhook.png)

## Receiving payloads

When an event occurs, perfsee will send a `POST` request to the configured url and includes the data involved in the payload.

The following code demonstrates how to build a simple server with express to receive webhook events.

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

> When your server receives a webhook request, it should return a success status code (>= 200 and < 300) as soon as possible. If no response is received for 30 seconds, perfsee will retry the request.

## Validating payloads

To ensure that the webhook request comes from perfsee and prevent others faking the request, you also need to validate the payload.

First you need to set a `secret` in the webhook settings, after that every webhook requests sent by perfsee will contain an `X-Perfsee-Signature-256` header. This is an [HMAC](https://en.wikipedia.org/wiki/HMAC) hex digest for request body, with `sha256=` prefix, typical forms are `sha256=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

When your server receives a request, you can to use `secret` and the request body to generate a digest and compare it with the digest provided in the header to complete the validation.

The following demonstrates how to validate with express.

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

## POST Example

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
