---
sidebar_position: 4
---

# 部署

## 前端

### 打包

对于 Perfsee 前端工程，我们需要使用 Webpack 来打包代码，打包后的代码会输出到 `./assets/platform` 目录下，之后可以根据自己的需求，决定是上传到 CDN 还是使用静态资源服务去提供给用户访问。

```bash
# 注意：生产环境打包产物需要设置 NODE_ENV=production
export NODE_ENV=production

yarn cli bundle -p @perfsee/platform
```

### CDN

如果使用 CDN 服务分发静态资源，那么可以通过设置 `PUBLIC_PATH` 环境变量来指定 CDN 路径前缀。

```bash
export PUBLIC_PATH=https://your.cdn/perfsee/assets

yarn cli bundle -p @perfsee/platform
```

### API 服务

如果有服务端 API 与前端使用不同域名的需求，如使用 `https://api.perfsee.com` 来提供 API 服务，那么可以通过设置 `SERVER` 环境变量来指定 API 服务地址。

```bash
export SERVER=https://api.perfsee.com

yarn cli bundle -p @perfsee/platform
```

## 后端

### 机器资源需求

后端服务对于资源的依赖较小。

|      | 规格           |
| ---- | -------------- |
| 最小 | 2 cores 4G Mem |
| 推荐 | 4 cores 8G Mem |

### 编译

为了部署后端服务，我们不需要像前端项目那样使用 Webpack 来打包源代码，但是由于源代码使用 TypeScript 编写，我们需要先将其编译到 JavaScript 这样 Node.js 才能正常启动。

```bash
# 编译 typescript
yarn build:ts
```

### 设置运行时环境变量

在后端服务运行时，环境变量通常是非常重要的，它们会直接影响到后端服务的行为。所以在部署之前，我们需要先设置好这些环境变量。

Perfsee 支持使用 `.env` 模式去便捷地设置通用环境变量，我们只需要将 `./packages/platform-server/.env.example` 文件复制一份，并重命名为 `.env`，然后根据自己的需求，修改其中的配置，这些配置将会影响后端服务运行时的行为。

当然，你也可以根据自己的服务提供商，在合适的地方设置环境变量，这样就不需要修改甚至是创建 `.env` 文件了。

```bash
# 设置 .env
cp ./packages/platform-server/.env.example ./packages/platform-server/.env
```

### 启动服务

由于项目代码中使用到了 TypeScript 提供的引用路径别名能力，例如 `@perfsee/shared => ./packages/shared/src/index.ts`，所以在启动服务之前，我们需要先使用在 tools 中提供的 `paths-register` 工具来注册这些别名，这样 Node.js 才能正确解析这些引用路径。

```bash
node -r ./tools/paths-register ./packages/platform-server/dist/index.js
```

### 前端静态资源

最后，如果想要通过后端服务去代理前端静态资源，那么在启动后端服务之前，使用在前文中说明的部署前端的方式打包代码后，产物自动存放在了 `./assets/platform` 下，后端服务会自动通过相对的路径去找到这些静态资源并返回。

## Runner

### 机器资源需求

由于 Runner 会在机器上启动无头浏览器其分析用户页面，所以对于机器的资源规格及稳定性都有非常大的依赖。

:::caution
请务必确保部署 Runner 的机器能够满足以下的最小需求，并且不会被动态括缩容及资源回收，否则将大幅影响分析任务稳定性。

此外需要 Chromium 的支持，所以需要在部署 Runner 的机器或容器中提前安装 Chromium，具体安装方式请参考 [Chromium](https://www.chromium.org/getting-involved/download-chromium)。
:::

|      | 规格           |
| ---- | -------------- |
| 最小 | 4 cores 8G Mem |

### 获取注册令牌

在部署 Runner 之前，我们首先需要了解，Runner 依赖后端服务，所以在部署之前需要确保后端服务已经正确部署并可以在将要部署 Runner 的机器上被访问。Runner 将会在启动之后去后端服务中注册自己，获取任务，然后执行任务，最后将结果上报给后端服务。注册的过程需要一个注册令牌，这个令牌需要管理员在后端服务的[管理页面](https://where.server.deployed/admin/runners)中获取。

### 部署

```bash
# 同样需要编译 typescript
yarn build:ts

# 告诉 Runner 需要通信的后端服务地址
export PERFSEE_PLATFORM_HOST=https://where.server.deployed
# 上文所说的注册 Job Runner 所需的令牌
export PERFSEE_REGISTRATION_TOKEN=YOUR_REGISTRATION_TOKEN

# 启动服务
node -r ./tools/paths-register ./packages/runner/executor/dist/index.js
```

### 发布 Runner Scripts

Runner 在执行分析任务前，需要先从服务端拉取对应分析逻辑，这些分析逻辑被称为 Runner Scripts。Runner Scripts 实现逻辑存放在 `./packages/runner` 目录下。
管理员可以在[管理页面](https://where.server.deployed/admin/runner-scripts)中查看、管理当前 Runner 所使用的分析逻辑版本。

每当 Runner 获取到一个新的分析任务，首先会根据任务的类型去服务端查询对应类型的分析脚本版本是否与本地缓存一致，如果存在新版本，那么 Runner 将会在下载、验证后开始执行分析逻辑。Runner Scripts 版本与发布时对应的包版本一直，所以发版前需要通过 `yarn release` 命令更新版本号，避免版本号冲突。

可以通过我们提供的脚本，快速发布新的 Runner Scripts。

:::caution
为避免线上环境执行错误，新发布的 Runner Scripts 不会默认启用，需要在验证完成后，通过[管理页面](https://where.server.deployed/admin/runner-scripts)中启用。
:::

```bash
// 服务端的部署地址
export PERFSEE_PLATFORM_HOST=https://where.server.deployed
// 同 Runner 注册时所使用的令牌，在管理后台获取
export PERFSEE_REGISTRATION_TOKEN=YOUR_REGISTRATION_TOKEN
yarn cli upload-scripts
```

## 子路径部署

在理想的情况下，我们通常能够使用独立的域名部署 Perfsee 服务，例如 `perfsee.com`。但是在实际的生产环境中，我们可能并不会资源申请额外的域名，所以我们需要在一个域名下部署多个服务，这时候就需要使用子路径来区分不同的服务。

Perfsee 的代码库提供了开箱即用的子路径部署方案，你只需要在打包前端产物前，设置 `SUB_PATH` 环境变量，然后在部署后端服务时，设置 `PERFSEE_SERVER_SUB_PATH` 环境变量，就可以子路径下部署 Perfsee 服务了。

```bash
# 打包前端产物
# 例如，将服务部署在在 https://your.domain/perfsee
export SUB_PATH=/perfsee
# 为新的子路径生成对应的类型代码
yarn codegen

yarn cli bundle -p @perfsee/platform
```

```bash
# 启动后端服务
export PERFSEE_SERVER_HOST=your.domain
export PERFSEE_SERVER_SUB_PATH=/perfsee

node -r ./tools/paths-register ./packages/platform-server/dist/index.js
```
