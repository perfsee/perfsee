/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

export const CONNECTIONS = [
  // { id: 'regular2G', title: 'Regular 2G', download: 32000, upload: 6400, latency: 300 },
  // { id: 'good2G', title: 'Good 2G', download: 57600, upload: 19200, latency: 150 },
  { id: 'slow3G', title: 'Slow 3G', download: 40000, upload: 40000, latency: 400, rtt: 300 },
  // { id: 'regular3G', title: 'Regular 3G', download: 96000, upload: 32000, latency: 300 },
  { id: 'good3G', title: 'Good 3G', download: 196608, upload: 96000, latency: 150, rtt: 300 },
  // { id: 'emergingMarkets', title: 'Emerging Markets 3G', download: 400000, upload: 400000, latency: 400 },
  { id: 'regular4G', title: 'Regular 4G', download: 1524288, upload: 393216, latency: 170, rtt: 80 },
  { id: 'LTE', title: '4G LTE', download: 3000000, upload: 3000000, latency: 70, rtt: 80 },
  // { id: 'dsl', title: 'DSL', download: 262144, upload: 131072, latency: 30 },
  { id: 'wifi', title: 'WiFi', download: 3932160, upload: 1966080, latency: 10, rtt: 40 },
  { id: 'cable', title: 'Cable', download: 5000000, upload: 5000000, latency: 20, rtt: 0 },
]

export const DEVICES = [
  { id: 'iPhone6', value: 'iPhone 6', cpuSlowdownMultiplier: 4 },
  { id: 'iPhone8', value: 'iPhone 8', cpuSlowdownMultiplier: 2 },
  { id: 'iPhoneX', value: 'iPhone X', cpuSlowdownMultiplier: 2 },
  { id: 'Nexus5X', value: 'Nexus 5X', cpuSlowdownMultiplier: 4 },
  { id: 'Nexus6P', value: 'Nexus 6P', cpuSlowdownMultiplier: 4 },
  { id: 'Pixel2XL', value: 'Pixel 2 XL', cpuSlowdownMultiplier: 2 },
  { id: 'iPad', value: 'iPad', cpuSlowdownMultiplier: 1 },
  { id: 'iPadPro', value: 'iPad Pro', cpuSlowdownMultiplier: 1 },
]
