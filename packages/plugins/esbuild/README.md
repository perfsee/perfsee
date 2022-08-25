## Usage

```ts
const { PerfseePlugin } = require('@perfsee/esbuild')

// Do not use buildAsync
require('esbuild').build({
  // ...
  plugins: [PerfseePlugin(options)],
  // ...
})
```

### `options`

```ts
interface Options {
  /**
   * Your project ID on PerfSee platform.
   *
   * **Required if you want ot upload the build to Perfsee platform for further analysis.**
   */
  project?: string

  /**
   * Give a uniq name for the bundled artifact.
   *
   * This option will be very useful when there are multiple builds in a single commit(in single CI progress)
   *
   * Because the comparasion with historical builds is based on `Entrypoint`, and if multiple builds
   * emit same entrypoint names, we can't detect which entrypoint is the correct one to be compared.
   *
   * e.g. `build-1/main` and `build-2/main` are more confusing then `landing/main` and `customers/main`.
   *
   * @default 'main'
   */
  artifactName?: string

  /**
   * Enable analysis and audit right after bundle emitted.
   *
   * With this option being `true`, perfsee will output bundle analyzed result in-place in CI workflow,
   * or start a server which serves html report viewer in non-CI environment.
   *
   * It would slow down the progress if enabled.
   *
   * @environment `PERFSEE_AUDIT`
   *
   * @default false
   * @default true // "in CI environment"
   */
  enableAudit?: boolean

  /**
   * Used to customize project's own bundle auditing logic.
   *
   * Return `true` means this bundle should pass auditing, `false` to fail.
   *
   * Only used when `enableAudit` is true.
   *
   * @default (score) => score >= 80
   */
  shouldPassAudit?: (score: number, result: BundleResult) => Promise<boolean> | boolean

  /**
   * Fail the progress if bundle audit not pass and exit with non-zero code.
   *
   * set to `true` to fail the CI pipeline.
   *
   * @default false
   */
  failIfNotPass?: boolean

  /**
   * Authentication token used for uploading build to remote server.
   * will also read from env `PERFSEE_TOKEN` if not provided.
   *
   * @environment `PERFSEE_TOKEN`
   */
  token?: string

  /**
   * Server options used to start local report viewer
   */
  severOptions?: {
    /**
     * Port the local report server will listen on
     *
     * @default 8080
     */
    port?: number

    /**
     * Host of the local report server
     *
     * @default '127.0.0.1'
     */
    host?: string

    /**
     * Path of the static files used to render report.
     *
     * Unless you want to change the default report viewer, otherwise leave it undefined.
     */
    publicPath?: string
  }
}
```
