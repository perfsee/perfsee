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

import { hrtime } from 'process'

import { Counter, Gauge, Summary } from 'prom-client'

import { MetricsProvider, MetricType, TimerMetricType } from '.'

export class PrometheusMetricsProvider implements MetricsProvider {
  constructor() {}

  counter: MetricType = (name, labelNames = []) => {
    name = this.transformName(name)
    const counter = new Counter({ name, help: name, labelNames })

    return (value = 1, labels) => {
      const transformedLabels = this.transformLabels(labels)
      counter.inc(transformedLabels, value)
    }
  }

  store: MetricType = (name, labelNames = []) => {
    name = this.transformName(name)
    const gauge = new Gauge({ name, help: name, labelNames })

    return (value, labels) => {
      const transformedLabels = this.transformLabels(labels)
      gauge.set(transformedLabels, value)
    }
  }

  timer: TimerMetricType = (name, labelNames = []) => {
    name = this.transformName(name)
    const summary = new Summary({ name, help: name, labelNames })

    return (labels) => {
      const transformedLabels = this.transformLabels(labels)
      const now = hrtime()

      return () => {
        const delta = hrtime(now)
        const value = delta[0] + delta[1] / 1e9

        summary.observe(transformedLabels, value)
      }
    }
  }

  time: MetricType = (name, labelNames = []) => {
    name = this.transformName(name)
    const summary = new Summary({ name, help: name, labelNames })

    return (value, labels) => {
      const transformedLabels = this.transformLabels(labels)
      summary.observe(transformedLabels, value)
    }
  }

  meter: MetricType = (name, labelNames = []) => {
    name = this.transformName(name)
    const counter = new Counter({ name, help: name, labelNames })

    return (value, labels) => {
      const transformedLabels = this.transformLabels(labels)
      counter.inc(transformedLabels, value)
    }
  }

  private transformName(name: string) {
    return name.replace(/\./g, ':')
  }

  private transformLabels(labels: Record<string, any> = {}) {
    return Object.entries(labels).reduce((result, [key, value]) => {
      result[key] = String(value)
      return result
    }, {} as Record<string, string | number>)
  }
}
