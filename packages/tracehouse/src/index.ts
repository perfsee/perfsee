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

function dynamicImport(specifier: string): Promise<any> {
  // eslint-disable-next-line
  return new Function('specifier', 'return import(specifier)')(specifier)
}

async function processTrace(trace: LH.Trace) {
  const { TraceProcessor } = (await dynamicImport(
    'lighthouse/core/lib/tracehouse/trace-processor.js',
  )) as typeof import('lighthouse/core/lib/tracehouse/trace-processor')

  return TraceProcessor.processTrace(trace)
}

async function getMainThreadTasks(processedTrace: LH.Artifacts.ProcessedTrace) {
  const { mainThreadEvents, timestamps, frames } = processedTrace
  const { MainThreadTasks } = (await dynamicImport(
    'lighthouse/core/lib/tracehouse/main-thread-tasks.js',
  )) as typeof import('lighthouse/core/lib/tracehouse/main-thread-tasks')
  try {
    const tasks = MainThreadTasks.getMainThreadTasks(mainThreadEvents, frames, timestamps.traceEnd) as TaskNode[]
    return transformTask(tasks)
  } catch (e) {
    console.error(String(e))
    return []
  }
}

async function processNavigation(processedTrace: LH.Artifacts.ProcessedTrace) {
  const { TraceProcessor } = (await dynamicImport(
    'lighthouse/core/lib/tracehouse/trace-processor.js',
  )) as typeof import('lighthouse/core/lib/tracehouse/trace-processor')
  return TraceProcessor.processNavigation(processedTrace)
}

export async function computeMainThreadTasks(trace: LH.Trace) {
  return getMainThreadTasks(await processTrace(trace))
}

export async function computeMainThreadTasksWithTimings(trace: LH.Trace) {
  const processedTrace = await processTrace(trace)

  const timings = await (async () => {
    try {
      return (await processNavigation(processedTrace)).timings
    } catch (e) {
      console.error(String(e))
      return null
    }
  })()

  return {
    tasks: await getMainThreadTasks(processedTrace),
    timings,
  }
}
