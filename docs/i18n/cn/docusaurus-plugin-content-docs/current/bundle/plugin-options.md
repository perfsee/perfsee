---
id: plugin-options
title: 打包工具插件参数
sidebar_position: 4
---

### 打包工具插件通用参数描述

```typescript
interface Options {
  /**
   * Perfsee 平台对应的项目 ID。
   *
   * **如果想要上传打包产物到平台进行分析，则该选项必填。**
   */
  project?: string

  /**
   * Perfsee 平台对应的 url。
   *
   * 用于私有部署 perfsee，等同于设置 `PERFSEE_PLATFORM_HOST`。
   */
  platform?: string

  /**
   * 用于产物上传流程鉴权的凭证。
   *
   * 如果没有提供，还会尝试读取环境变量 `PERFSEE_TOKEN`。
   *
   * @environment `PERFSEE_TOKEN`
   */
  token?: string

  /**
   * 给打包的产物指定一个项目内唯一的名字。
   *
   * 在一次提交（单个 CI 工作流）中，如果有会构建多次，即有多个打包产物时会很有用。
   *
   * 因为我们和基准的对比是基于 `Entrypoint`，如果多次构建产生的打包产物的 `Entrypoint` 名字相同，我们无法确定哪个是正确的用来被对比的基准。
   *
   * 例如：`landing/main` 和 `customers/main` 很直接的告诉我们两份产物的区别，后续我们也可以用相同名字的产物进行对比。
   *
   * @default 'main'
   */
  artifactName?: string

  /**
   * 是否在打包完成后启用分析和审计。
   *
   * 启用分析和审计后，perfsee 将会在 CI 工作流中输出分析结果，或者在非 CI 环境下启动一个服务，用于展示分析结果。
   *
   * **将会使打包速度变慢**
   *
   * @environment `PERFSEE_AUDIT`
   *
   * @default false
   * @default true // 在 CI 环境中
   */
  enableAudit?: boolean

  /**
   * 自定义打包产物的审计逻辑。
   *
   * 返回 `true` 表示这个打包产物应该通过审计，`false` 表示不通过。
   *
   * 只有当 `enableAudit` 为 `true` 时才会使用这个参数。
   *
   * @default (score) => score >= 80
   *
   */
  shouldPassAudit?: (score: number, result: BundleResult) => Promise<boolean> | boolean

  /**
   * 在审计不通过时已非 0 状态码退出分析进程。
   *
   * 设置为 `true` 后，可以让 CI 流程失败。
   *
   * @default false
   *
   */
  failIfNotPass?: boolean

  /**
   * 输出 Bundle 报告静态 html 文件的选项。
   * 只有当 `enableAudit` 为 `true` 时才会使用这个参数。
   */
  reportOptions?: {
    /**
     * 自动在浏览器中打开报告。
     *
     * @default true
     */
    openBrowser?: boolean

    /**
     * 生成的 Bundle 报告文件的路径
     * 它可以是绝对路径，也可以是相对于 Bundle 输出目录的路径。
     *
     * 默认报告会生成到 node_modules 中的 .cache 目录。
     */
    fileName?: string
  }
}
```
