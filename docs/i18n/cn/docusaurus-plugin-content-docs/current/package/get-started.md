---
id: get-started
title: 开始使用
sidebar_position: 1
---

## Step 1: 安装 SDK

```bash
# or any package manager you are using, e.g. npm/pnpm
yarn add @perfsee/package -D
```

## Step 2: 新建 Benchmark 文件 (可选)

在仓库目录下任意位置创建 `test.bench.js` 文件

```js
const Benchmark = require('@perfsee/package')

Benchmark('foo', () => {
  bar()
})

Benchmark('bar', [
  {
    test: () => {
      baz()
    },
    options: { name: 'baz' },
  },
  {
    test: async () => {
      await setup()
      return () => {
        quz()
      }
    },
    options: { name: 'quz with async setup' },
  },
])
```

## Step 3: 在 CI 环境分析 Package 并上传结果

在分析之前，必须先在 Perfsee 平台上创建项目，并在 [Token Management](https://perfsee.com/me/access-token) 页面申请 API Token。

```bash
PERFSEE_TOKEN=<your-token> npx @perfsee/package <path-to-package> --project=<perfsee-project-id>
```

运行这个命令时，如果项目中有 `xxx.{bench,benchmark}.{js,ts}` 命名（默认配置可更改）的文件，则会将这些文件识别为 benchmarks 运行并将结果上传。

注意：只有在 CI 环境，结果才会上传至 Perfsee 平台。

### Cli Options

### project

Perfsee 平台项目 id。

### target: `'browser'` | `'node'`

#### default: `'node'`

如果 target 为 `browser`，benchmarks 文件会被打包上传至服务端在无头浏览器中运行，除非设置了 `--local`。

### local: boolean

如果设置了 `--local`，benchmarks 会在本地运行。

### benchmarkPattern

#### default: `'*.{bench|benchmark}.{js|ts}'`

Benchmarks 文件的 glob pattern。

## Step 4: View the report

当分析结束后上传完成后，我们会自动生成一个报告链接。这个链接会展示你的 package 的分析结果。详细信息请查看[报告详解](./package-report).
