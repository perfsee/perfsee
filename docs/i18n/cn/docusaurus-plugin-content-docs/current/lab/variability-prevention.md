---
sidebar_position: 8
---

# 如何避免结果波动

我们提供两种方式让运行结果更稳定。

## Lab 请求代理

开启请求代理后，会在一定程度上减少网络请求对于页面跑分的影响。

### 功能行为

开启请求代理后，Perfsee 会启动一个 TCP 层的代理 server，会在进行 Lab 分析前为页面进行两次预加载，预加载过程中会将所有静态资源、部分 API 请求缓存起来，再进行真正的 Lab 分析。

在进行 Lab 分析时

- 如果页面请求命中了之前缓存的请求，则不会发起真正的请求，而是直接从缓存返回数据。
- 所有的请求都会被代理成 https + http2 协议，无论这个请求源站是 http1.1 还是 http2。

### 如何开启

在 Settings -> Profile 页面，新建或者修改 Profile 都可以勾选 Request Proxy

![enable request proxy](/lab/request-proxy.png)

## CPU throttling

开启 CPU throttling 后，会在一定程度上减少 CPU 性能对于页面跑分的影响。

### 原理

Lighthouse 会在每次产出报告之后计算出一个 `benchmarkIndex` 作为 CPU 性能的粗略估值。我们则会利用这个估值，在每一次快照运行时传入一个动态的 `cpu slowdown multiplier` 来让每次运行模拟在一个特性性能基准的环境中。

### 如何开启

在 Settings -> Profile 页面, 模拟设备选项选择任何一个非默认值 (非 `No emulation: Chrome(Default)`) 选项, CPU profiling 就会开启.

如果你不想模拟移动端设备，只想开启 CPU throttling 让结果更稳定, 选 `Low-end Desktop` 就好.

![enable cpu throttling](/lab/cpu-throttling.png)
