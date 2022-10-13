---
id: plugin-options
title: 插件参数
sidebar_position: 4
---

### 插件参数

```typescript
type Options = {
  /**
   * Perfsee 平台对应的项目 ID。
   *
   * **如果想要上传打包产物到平台进行分析，则该选项必填。**
   * **Required if you want ot upload the build to Perfsee platform for further analysis.**
   */
  project?: string

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
   * 在审计不通过时已非 0 状态吗退出分析进程。
   *
   * 设置为 `true` 后，可以让 CI 流程失败。
   *
   * @default false
   *
   */
  failIfNotPass?: boolean

  /**
   * 用于本地分析结果展示的服务配置。
   */
  serverOptions?: {
    /**
     * 本地报告服务监听的端口
     *
     * @default 8080
     */
    port?: number

    /**
     * 本地报告服务监听的地址
     *
     * @default '127.0.0.1'
     */
    host?: string

    /**
     * 用于渲染本地报告的静态文件路径。
     *
     * 除非你想更改默认的渲染视图，否则不要设置这个参数。
     */
    publicPath?: string
  }
}
```
