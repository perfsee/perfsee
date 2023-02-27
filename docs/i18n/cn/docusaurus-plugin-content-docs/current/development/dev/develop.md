---
sidebar_position: 2
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# 开发

## 初始化

### 安装依赖

当前我们使用 `yarn` 来管理项目依赖，所以需要在开始之前正确安装 `yarn`。
如果尚未安装 `yarn`，可以在 [yarn 安装指南](https://yarnpkg.com/en/docs/install) 找到详细的安装方法。

```bash title="安装依赖"
yarn
```

### 代码生成

在安装完依赖之后，我们需要生成一些必要的类型文件，让 `测试`，`类型检查` 以及 `代码格式检查`能够正确工作。
可以通过简单的命令就能生成这些文件：

```bash title="代码生成"
yarn codegen
```

## 启动开发服务

### 手动启动开发服务

:::note
如果采取手动启动开发服务的方式，那么在开始之前，我们需要参考[项目架构](./architecture)中的说明，正确安装了以下依赖，并确保其处于可用状态：

- [Mysql](https://www.mysql.com/downloads) 用于存储数据
- [Redis](https://redis.io/download) 用于存储缓存
  :::

Perfsee 由很多组件及服务组成，但在日常开发的过程中，最常见到的是这三个：

- [Server](https://github.com/perfsee/perfsee/tree/main/packages/platform-server): 主要的后端服务
- [Frontend](https://github.com/perfsee/perfsee/tree/main/packages/platform): 前端代码
- [Job Runner](https://github.com/perfsee/perfsee/tree/main/packages/runner): 分析任务执行器服务

你可以选择你需要开发的服务，然后独立启动他们：

<Tabs>
<TabItem value="Server">

```bash
# 启动后端服务，默认监听 3000 端口，通过 http://localhost:3000 访问
yarn dev -p @perfsee/platform-server
```

</TabItem>
<TabItem value="Frontend">

```bash
# 启动前端服务，默认监听 8080 端口，通过 http://localhost:8080 访问
# 依赖后端服务，所有后端请求都会被代理到 http://localhost:3000
yarn dev -p @perfsee/platform
```

</TabItem>
<TabItem value="Job Runner">

```bash
# 启动任务执行器服务，不会监听任何端口
# 依赖后端服务，想要消费本地任务，需要启动 Job Runner
yarn dev -p @perfsee/job-runner
```

</TabItem>
</Tabs>

### Docker compose

如果你倾向于使用 Docker 这样的工具去管理开发环境的话，我们已经预先配置好了一个 `docker-compose.yml` 文件，你可以非常轻松的启动整个开发环境，无需考虑系统依赖问题：

```bash title="Docker compose"
# 由于 docker compose v2 不会遵循 `depends_on` 的依赖关系去顺序的构建镜像，所以需要单独的先把所有需要的镜像构建出来。
# 详情查看：https://github.com/docker/compose/issues/9686
docker-compose build
docker-compose up
```

## 测试

我们选择了 [`ava`](https://github.com/avajs/ava) 作为测试框架。查看其文档可以了解如何编写测试用例。

所有测试用例都应该放在与被测试的组件或函数相邻的 `__tests__` 文件夹下，并以 `.spec.ts` 或 `.spec.e2e.ts` 作为后缀名，以方便查找。

> 如果测试用例在并发运行时会有不可预知的副作用，比如读写数据库，那么应该使用 `.spec.e2e.ts` 或 `.spec.serial.ts` 作为后缀名，将其标记为仅可串行运行的测试用例。

```bash
# 运行所有测试用例
yarn test

# 仅运行 `.spec.ts` 后缀的测试用例
yarn ava

# 仅运行 `.spec.{e2e,serial}.ts` 后缀的测试用例
yarn ava -s
```

## 代码风格

我们使用 [`ESLint`](./.eslintrc.js) 和 [`Prettier`](./package.json) 来强制代码风格：

```bash
yarn lint
```

并且使用 [`TypeScript`](./tsconfig.json) 来进行强类型检查：

```bash
yarn typecheck
```

## Commit

我们设置了 `commitlint` 来检查 Commit Message，详情请查看 [commitlint](https://github.com/conventional-changelog/commitlint) 的文档。

大体上来说，所有的 Commit Message 都应该遵循以下格式：

```
type(scope?): subject
```

`type` 取决于该 Commit 的内容，比如 `feat` 表示添加新功能，`fix` 表示修复 bug，`ci` 表示 CI 相关的修改，等等。你可以在 [commitlint](https://github.com/conventional-changelog/commitlint) 中找到完整的列表。

`scope` 可以是包名，也可以是文件夹名，用于概括 Commit 所涉及到的包。

`subject` 则是对 Commit 内容的简短描述。

这里有一些实际的例子：

```
feat(platform): add a retry button on failed job
fix(job-runner): random panic when spawning workers
chore: bump up dependencies
```

我们强烈建议每个 Commit 只做一件事，不要把多个不想关的修改混在一起。

## 版本管理

感谢 `conventional-changelog`，依赖可读的很高的 commit message，我们可以很容易的生成更新日志及为下一个包发版选择合适的版本号。

```bash
yarn release
```

## 部署

由于部署涉及到的细节较多，我们将会在单独的[部署文档](../deployment)中详细描述一下，如何将 Perfsee 一系列服务部署到生产环境上去。
