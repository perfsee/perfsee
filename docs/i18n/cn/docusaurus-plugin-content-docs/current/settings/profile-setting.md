---
sidebar_position: 3
---

# Profile 设置

可以配置测试网站的条件。平台可以模拟流行的设备（例如 iPhone，iPad 和 Nexus 手机），限制网络连接。

所有项目被创建的时候都会有一个默认 Profile：Desktop， Network throttling 是 unlimit。

:::warning

当 **删除** profile 的时候，**所有** 使用该 profile 生成的 snapshot report 也会被一并删除。

:::

![profiles](/settings/profiles.png)

![edit profile](/settings/edit-profile.png)

## 模拟设备 （Device emulation）

我们利用 Google Chrome 设备模拟以及其他一些机制来确保体验尽可能接近真实设备。

平台提供了以下设备的模拟：

- iPhone 6
- iPhone 8
- iPhone X
- Nexus 5X
- Nexus 6P
- Pixel 2 XL
- iPad
- iPad Pro

当配置了该参数，会有如下影响：

- 设备的 viewport 发生改变；
- 会设置该设备对应的 User-Agent；
- CPU 会被设备的硬件条件影响而变慢；（CPU slowdown multiplier）

## 模拟网络连接速度（Connection speed）

通过使用预配置网络速度选项来限制浏览器可用的带宽。

预配置网络速度选项如下:

| Label                   | Latency | Download    | Upload      | RTT   |
| ----------------------- | ------- | ----------- | ----------- | ----- |
| No bandwidth throttling | -       | -           | -           | -     |
| Slow 3G                 | 400ms   | 40.00 KB/s  | 40.00 KB/s  | 300ms |
| Good 3G                 | 150ms   | 196.61 KB/s | 96.00 KB/s  | 300ms |
| Regular 4G              | 170ms   | 1.52 MB/s   | 392.22 KB/s | 80ms  |
| 4G LTE                  | 70ms    | 3.00 MB/s   | 3.00 MB/s   | 80ms  |
| WiFi                    | 10ms    | 3.93 MB/s   | 1.97 MB/s   | 40ms  |
| Cable                   | 20ms    | 5.00 MB/s   | 5.00 MB/s   | 0ms   |

### React Profiling

:::caution 注意

这是一个实验性的功能，可能存在不稳定的情况。如果没有按照预期工作，请向我们报告 Issue。

这个功能可能会降低页面渲染速度。

:::

![](/settings/react-profiling.png)

开启这个功能，会在 Lab 分析阶段收集 React 应用每个组件渲染时间等信息。分析报告中会展示组件火焰图，帮助我们分析 React 应用性能瓶颈。

这个功能是基于 React Profiler API 实现的，但 Profier API 在生产环境是关闭的。我们通过拦截 `react-don` 对应资源的请求，并将其替换成 profiling build 来解决这个问题。
