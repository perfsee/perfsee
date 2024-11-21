---
hide_table_of_contents: true
full_width: true
---

# Lighthosue Running Flags

Lighthouse running flags 用于自定义某些运行时行为，你可以在 **Profile** 配置中设置这些 flags。

下面是目前支持的 flags。

```ts
interface LighthouseRunningFlags {
  /** The locale to use for the output. e.g. 'zh' | 'en' */
  locale?: string
  /** The maximum amount of time to wait for a page content render, in ms.
   * If no content is rendered within this limit, the run is aborted with an error.
   */
  maxWaitForFcp?: number
  /** The maximum amount of time to wait for a page to load, in ms. */
  maxWaitForLoad?: number
  /** List of URL patterns to block. */
  blockedUrlPatterns?: string[] | null
  /**
   * Flag indicating which kinds of browser storage should be reset for the audit.
   * Cookies are not cleared by default, so the user isn't logged out.
   * indexeddb, websql, and localstorage are not cleared by default to prevent
   * loss of potentially important data.
   * https://chromedevtools.github.io/debugger-protocol-viewer/tot/Storage/#type-StorageType
   */
  clearStorageTypes?: StorageType[]
  /** If set to true, will skip the initial navigation to about:blank. */
  skipAboutBlank?: boolean
  /** If set to true, gatherers should avoid any behavior that may be destructive to the page state.
   * (e.g. extra navigations, resizing the viewport)
   */
  usePassiveGathering?: boolean
  /** How Lighthouse should interpret this run in regards to scoring performance metrics and skipping mobile-only tests in desktop.
   * Must be set even if throttling/emulation is being applied outside of Lighthouse.
   */
  formFactor?: 'mobile' | 'desktop'
  /** Screen emulation properties (width, height, dpr, mobile viewport) to apply or an object of `{disabled: true}`
   * if Lighthouse should avoid applying screen emulation.
   * If either emulation is applied outside of Lighthouse, or it's being run on a mobile device, it typically should be set to disabled.
   * For desktop, we recommend applying consistent desktop screen emulation.
   */
  screenEmulation?: Partial<ScreenEmulationSettings>
  /** User Agent string to apply, `false` to not change the host's UA string, or `true` to use Lighthouse's default UA string. */
  emulatedUserAgent?: string | boolean
  /** The method used to throttle the network. */
  throttlingMethod?: 'devtools' | 'simulate' | 'provided'
  /** The throttling config settings. */
  throttling?: ThrottlingSettings
  /** If present, the run should only conduct this list of audits. */
  onlyAudits?: string[] | null
  /** If present, the run should only conduct this list of categories. */
  onlyCategories?: string[] | null
  /** If present, the run should skip this list of audits. */
  skipAudits?: string[] | null
  /** List of extra HTTP Headers to include. */
  extraHeaders?: Record<string, string> | null // Matches `Protocol.Network.Headers`.
  /** How Lighthouse was run, e.g. from the Chrome extension or from the npm module */
  channel?: string
  /** Precomputed lantern estimates to use instead of observed analysis. */
  precomputedLanternData?: PrecomputedLanternData | null
  /** The budget.json object for LightWallet. Please see https://github.com/GoogleChrome/budget.json */
  budgets?: Array<Budget> | null

  /** The number of milliseconds to wait after FCP until the page should be considered loaded. */
  pauseAfterFcpMs?: number
  /** The number of milliseconds to wait after the load event until the page should be considered loaded. */
  pauseAfterLoadMs?: number
  /** The number of milliseconds to wait between high priority network requests or 3 simulataneous requests before the page should be considered loaded. */
  networkQuietThresholdMs?: number
  /** The number of milliseconds to wait between long tasks until the page should be considered loaded. */
  cpuQuietThresholdMs?: number
  /** The URL to use for the "blank" neutral page in between navigations. Defaults to `about:blank`. */
  blankPage?: string
  /** Disables collection of the full page screenshot, which can be rather large and possibly leave the page in an undesirable state. */
  disableFullPageScreenshot?: boolean

  /** Disables failing on 404 status code, and instead issues a warning */
  ignoreStatusCode?: boolean

  /// The above are lighthouse official flags, below are Perfsee additional flags.

  /** If false, Perfsee will fail the report when redirections occurs. Defaults to true */
  ignoreRedirection?: boolean | string[]
  /** If true, the browser will be launched with `--disable-cache` flag. Defaults to false */
  disableCache?: boolean
  /** The domains need to force enable quic protocol. e.g. originToForceQuicOn: ['domain1.com:443'] */
  originToForceQuicOn?: string[]
}

type StorageType =
  | 'appcache'
  | 'cookies'
  | 'file_systems'
  | 'indexeddb'
  | 'local_storage'
  | 'shader_cache'
  | 'websql'
  | 'service_workers'
  | 'cache_storage'
  | 'interest_groups'
  | 'shared_storage'
  | 'storage_buckets'
  | 'all'
  | 'other'

type ScreenEmulationSettings = {
  /** Overriding width value in pixels (minimum 0, maximum 10000000). 0 disables the override. */
  width: number
  /** Overriding height value in pixels (minimum 0, maximum 10000000). 0 disables the override. */
  height: number
  /** Overriding device scale factor value. 0 disables the override. */
  deviceScaleFactor: number
  /** Whether to emulate mobile device. This includes viewport meta tag, overlay scrollbars, text autosizing and more. */
  mobile: boolean
  /** Whether screen emulation is disabled. If true, the other emulation settings are ignored. */
  disabled: boolean
}

/** Simulation settings that control the amount of network & cpu throttling in the run. */
interface ThrottlingSettings {
  /** The round trip time in milliseconds. */
  rttMs?: number
  /** The network throughput in kilobits per second. */
  throughputKbps?: number
  // devtools settings
  /** The network request latency in milliseconds. */
  requestLatencyMs?: number
  /** The network download throughput in kilobits per second. */
  downloadThroughputKbps?: number
  /** The network upload throughput in kilobits per second. */
  uploadThroughputKbps?: number
  // used by both
  /** The amount of slowdown applied to the cpu (1/<cpuSlowdownMultiplier>). */
  cpuSlowdownMultiplier?: number
}

interface PrecomputedLanternData {
  additionalRttByOrigin: { [origin: string]: number }
  serverResponseTimeByOrigin: { [origin: string]: number }
}
```
