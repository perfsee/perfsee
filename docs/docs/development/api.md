---
sidebar_position: 3
---

# Open API

## Introduction

Perfsee provides open api for public, it based on `GraphQL`, so you need to know the basic language syntax of [GraphQL](https://graphql.org/) before you can use it.

The API endpoint is `https://perfsee.com/graphql`

:::caution

All API share rate limit to 120 times/minute. Some tasks are triggered by independent rate limit, the result is shown in Response header: `x-ratelimit-limit` and `x-ratelimit-remaining`.

:::

## Authorization

Open api need authorization, please apply API Token on the [Token Management](https://perfsee.com/me/access-token) page.

Click 「Generate new token」

![generate new token](/api/generate-new-token.png)

Enter token name, it should not be the same as existing token, and click 「Create」

![token generated](/api/token-generated.png)

:::caution

**Caution, this dialog will be shown only once**, you CAN'T view the token value after you close the dialog. You can click 「Copy」 to copy the token to clipboard.

:::

## Send Request

After you generated a token, you can send request to open api with header:

```
Authorization: Bearer {token}
```

### Example

Here is an example to send an api request using the GraphQL playground:

![api example](/api/request.png)

:::caution

If you get an error which status code is not **200**, it should be GraphQL syntax error. Please check it first.

:::

## View GraphQL Schema

Check out [playground](https://perfsee.com/graphql), click `DOCS` on the right, and you can see all GraphQL api provided.

We would document all the api as much as possible, but some of them may not be well described. You can refer to us and request for an update.

## View RESTful API

Check out [Swagger Documents](https://perfsee.com/api), you can see all RESTful open api provided.

We would document all the api as much as possible, but some of them may not be well described. You can refer to us and request for an update.
