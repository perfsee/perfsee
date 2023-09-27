---
sidebar_position: 8
---

# How to avoid result variability

There are two ways to make the lab result more stable.

## Lab request proxy

After turning on the request proxy, the impact of network requests on results will be reduced to a certain extent.

### Abilities

After enabling request proxy, Perfsee will start a TCP proxy server and preload the page twice before performing Lab analysis. During the preloading process, all static resources and portions of API requests will be cached before the actual Lab is performed.

- If the page request hits a previously cached request, a real request will not be initiated, but the data will be returned directly from the cache.
- All requests will be proxied to https + http2 protocol, regardless of whether the request origin site is http1.1 or http2.

### How to enable

In Project Settings -> Profile page, we can check the `Request Proxy` when creating or modifying profiles.

![enable request proxy](/lab/request-proxy.png)

## CPU throttling

By enabling CPU throttling, the impact of CPU performance on results will be reduced to a certain extent.

### How it works

Lighthouse computes and saves a benchmarkIndex as a rough approximation of the host device's CPU performance with every report. We applies a dynamic CPU slowndown multiplier for every snapshot to simulate running on a deivce with a certern benchmarkIndex.

### How to enable

In Project Settings -> Profile page, set the device emulation to any non-default (not `No emulation: Chrome(Default)`) options, the CPU profiling will be enabled.

If you don't want to simulate mobiles and only want to make the results more stable, just chose `Low-end Desktop`.

![enable cpu throttling](/lab/cpu-throttling.png)
