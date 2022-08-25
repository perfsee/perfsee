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

import * as echarts from 'echarts/core'
import { isFunction, isEqual, pick, isString } from 'lodash'
import { PureComponent } from 'react'

import { ResizeSensor } from './resize-sensor'
import { ChartEventParam, EChartsInstance, EChartsReactProps } from './types'

export class BaseChart extends PureComponent<EChartsReactProps> {
  ele: HTMLElement | null
  resizeSensor: ResizeSensor | null

  constructor(props: EChartsReactProps) {
    super(props)

    this.ele = null
    this.resizeSensor = null
  }

  componentDidMount() {
    this.renderNewEcharts()
  }

  componentDidUpdate(prevProps: EChartsReactProps) {
    /**
     * if shouldSetOption return false, then return, not update echarts options
     * default is true
     */
    const { shouldSetOption } = this.props
    if (isFunction(shouldSetOption) && !shouldSetOption(prevProps, this.props)) {
      return
    }

    if (
      !isEqual(prevProps.theme, this.props.theme) ||
      !isEqual(prevProps.opts, this.props.opts) ||
      !isEqual(prevProps.onEvents, this.props.onEvents)
    ) {
      this.dispose()
      this.renderNewEcharts()
      return
    }

    // when thoes props isEqual, do not update echarts
    const pickKeys = ['option', 'notMerge', 'lazyUpdate', 'showLoading', 'loadingOption']
    if (isEqual(pick(this.props, pickKeys), pick(prevProps, pickKeys))) {
      return
    }

    const echartsInstance = this.updateEChartsOption()
    /**
     * when style or class name updated, change size.
     */
    if (!isEqual(prevProps.style, this.props.style) || !isEqual(prevProps.className, this.props.className)) {
      try {
        echartsInstance?.resize()
      } catch (e) {
        console.warn(e)
      }
    }
  }

  componentWillUnmount() {
    this.dispose()
  }

  bindElementRef = (e: HTMLElement | null) => {
    this.ele = e
  }

  render() {
    const { style, className = '' } = this.props
    // default height = 300
    const newStyle = { height: 300, width: '100%', ...style }

    return <div ref={this.bindElementRef} style={newStyle} className={`echarts-for-react ${className}`} />
  }

  private getEchartsInstance() {
    if (!this.ele) {
      return null
    }

    return echarts.getInstanceByDom(this.ele) ?? echarts.init(this.ele, this.props.theme, this.props.opts)
  }

  private dispose() {
    if (this.ele) {
      if (this.resizeSensor) {
        try {
          this.resizeSensor.destroy()
        } catch (e) {
          console.warn(e)
        }
      }
      echarts.dispose(this.ele)
    }
  }

  private renderNewEcharts() {
    const { onEvents, onChartReady } = this.props

    const echartsInstance = this.updateEChartsOption()

    if (echartsInstance) {
      this.bindEvents(echartsInstance, onEvents ?? {})
    }

    if (isFunction(onChartReady) && echartsInstance) {
      onChartReady(echartsInstance)
    }

    if (this.ele) {
      if (!this.resizeSensor) {
        this.resizeSensor = new ResizeSensor(this.ele)
      }

      this.resizeSensor!.bind(() => {
        try {
          echartsInstance?.resize()
        } catch (e) {
          console.warn(e)
        }
      })
    }
  }

  private bindEvents(instance: EChartsInstance, events: EChartsReactProps['onEvents']) {
    const _bindEvent = (eventName: string, func: (params: ChartEventParam) => void) => {
      if (isString(eventName) && isFunction(func)) {
        instance.on(eventName, (param) => {
          func(param, instance)
        })
      }
    }

    for (const eventName in events) {
      if (Object.prototype.hasOwnProperty.call(events, eventName)) {
        _bindEvent(eventName, events[eventName])
      }
    }
  }

  /**
   * render the echarts
   */
  private updateEChartsOption(): EChartsInstance | null {
    const { option, notMerge = true, lazyUpdate = false, showLoading, loadingOption = null } = this.props
    const echartInstance = this.getEchartsInstance()

    if (!echartInstance) {
      return null
    }

    echartInstance.setOption(option, notMerge, lazyUpdate)

    if (showLoading) {
      echartInstance.showLoading(loadingOption)
    } else {
      echartInstance.hideLoading()
    }

    return echartInstance
  }
}
