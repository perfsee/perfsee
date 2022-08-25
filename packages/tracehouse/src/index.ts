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

/// <reference path="../../../node_modules/lighthouse/types/externs.d.ts" />
/// <reference path="../../../node_modules/lighthouse/types/artifacts.d.ts" />
/// <reference path="../../../node_modules/lighthouse/types/global-lh.d.ts" />

const MainThreadTasks = require('lighthouse/lighthouse-core/lib/tracehouse/main-thread-tasks')
const TraceProcessor = require('lighthouse/lighthouse-core/lib/tracehouse/trace-processor')

export type TaskGroupIds =
  | 'parseHTML'
  | 'styleLayout'
  | 'paintCompositeRender'
  | 'scriptParseCompile'
  | 'scriptEvaluation'
  | 'garbageCollection'
  | 'other'

interface TaskGroup {
  id: TaskGroupIds
  label: string
  traceEventNames: string[]
}

interface TaskNode {
  event: LH.TraceEvent
  endEvent?: LH.TraceEvent
  children: TaskNode[]
  parent?: TaskNode
  unbounded: boolean
  startTime: number
  endTime: number
  duration: number
  selfTime: number
  attributableURLs: string[]
  group: TaskGroup
}

export type Task = Omit<TaskNode, 'group' | 'parent' | 'children'> & {
  kind: TaskGroupIds
  parent?: Task
  children: Task[]
}

// Monkey patch the `_isNavigationStartOfInterest` method of `TraceProcessor` to compatible the `file://` protocol
const ACCEPTABLE_NAVIGATION_URL_REGEX = /^(chrome|file|https?):/

TraceProcessor._isNavigationStartOfInterest = (event: LH.TraceEvent) => {
  return (
    event.name === 'navigationStart' &&
    (!event.args.data ||
      !event.args.data.documentLoaderURL ||
      ACCEPTABLE_NAVIGATION_URL_REGEX.test(event.args.data.documentLoaderURL))
  )
}

function transformTask(tasks: TaskNode[]): Task[] {
  return tasks.map((task: any) => {
    if (!task.group) {
      return task as Task
    }

    task.kind = task.group.id
    delete task.group

    task.children = transformTask(task.children)

    return task as Task
  })
}

function processTrace(trace: LH.Trace): LH.Artifacts.ProcessedTrace {
  return TraceProcessor.processTrace(trace)
}

function getMainThreadTasks(processedTrace: LH.Artifacts.ProcessedTrace): Task[] {
  const { mainThreadEvents, timestamps, frames } = processedTrace
  const tasks = MainThreadTasks.getMainThreadTasks(mainThreadEvents, frames, timestamps.traceEnd) as TaskNode[]
  return transformTask(tasks)
}

function processNavigation(processedTrace: LH.Artifacts.ProcessedTrace): LH.Artifacts.ProcessedNavigation {
  return TraceProcessor.processNavigation(processedTrace)
}

export function computeMainThreadTasks(trace: LH.Trace): Task[] {
  return getMainThreadTasks(processTrace(trace))
}

export function computeMainThreadTasksWithTimings(trace: LH.Trace): {
  tasks: Task[]
  timings: LH.Artifacts.NavigationTraceTimes
} {
  const processedTrace = processTrace(trace)

  return {
    tasks: getMainThreadTasks(processedTrace),
    timings: processNavigation(processedTrace).timings,
  }
}
