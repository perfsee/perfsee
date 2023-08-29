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

// Copyright 2022 The Chromium Authors. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//    * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//    * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//    * Neither the name of Google LLC nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

import { TraceEvent } from 'lighthouse/types/artifacts'

const KNOWN_EVENTS = new Map([
  /* Task/Other */
  ['Program' /* KnownEventName.Program */, { category: 'Other' /* EventCategory.Other */, label: 'Other' }],
  ['RunTask' /* KnownEventName.RunTask */, { category: 'Other' /* EventCategory.Other */, label: 'Run Task' }],
  ['AsyncTask' /* KnownEventName.AsyncTask */, { category: 'Other' /* EventCategory.Other */, label: 'Async Task' }],
  /* Load */
  ['XHRLoad' /* KnownEventName.XHRLoad */, { category: 'Load' /* EventCategory.Load */, label: 'Load' }],
  [
    'XHRReadyStateChange' /* KnownEventName.XHRReadyStateChange */,
    { category: 'Load' /* EventCategory.Load */, label: 'ReadyStateChange' },
  ],
  /* Parse */
  ['ParseHTML' /* KnownEventName.ParseHTML */, { category: 'Parse' /* EventCategory.Parse */, label: 'Parse HTML' }],
  [
    'ParseAuthorStyleSheet' /* KnownEventName.ParseCSS */,
    { category: 'Parse' /* EventCategory.Parse */, label: 'Parse StyleSheet' },
  ],
  /* V8 */
  [
    'V8.CompileScript' /* KnownEventName.CompileScript */,
    { category: 'V8' /* EventCategory.V8 */, label: 'Compile Script' },
  ],
  ['V8.CompileCode' /* KnownEventName.CompileCode */, { category: 'V8' /* EventCategory.V8 */, label: 'Compile Code' }],
  [
    'V8.CompileModule' /* KnownEventName.CompileModule */,
    { category: 'V8' /* EventCategory.V8 */, label: 'Compile Module' },
  ],
  ['V8.OptimizeCode' /* KnownEventName.Optimize */, { category: 'V8' /* EventCategory.V8 */, label: 'Optimize' }],
  [
    'v8.wasm.streamFromResponseCallback' /* KnownEventName.WasmStreamFromResponseCallback */,
    { category: 'Js' /* EventCategory.Js */, label: 'Streaming Wasm Response' },
  ],
  [
    'v8.wasm.compiledModule' /* KnownEventName.WasmCompiledModule */,
    { category: 'Js' /* EventCategory.Js */, label: 'Compiled Wasm Module' },
  ],
  [
    'v8.wasm.cachedModule' /* KnownEventName.WasmCachedModule */,
    { category: 'Js' /* EventCategory.Js */, label: 'Cached Wasm Module' },
  ],
  [
    'v8.wasm.moduleCacheHit' /* KnownEventName.WasmModuleCacheHit */,
    { category: 'Js' /* EventCategory.Js */, label: 'Wasm Module Cache Hit' },
  ],
  [
    'v8.wasm.moduleCacheInvalid' /* KnownEventName.WasmModuleCacheInvalid */,
    { category: 'Js' /* EventCategory.Js */, label: 'Wasm Module Cache Invalid' },
  ],
  /* Js */
  [
    'RunMicrotasks' /* KnownEventName.RunMicrotasks */,
    { category: 'Js' /* EventCategory.Js */, label: 'Run Microtasks' },
  ],
  [
    'EvaluateScript' /* KnownEventName.EvaluateScript */,
    { category: 'Js' /* EventCategory.Js */, label: 'Evaluate Script' },
  ],
  ['FunctionCall' /* KnownEventName.FunctionCall */, { category: 'Js' /* EventCategory.Js */, label: 'Function Call' }],
  ['EventDispatch' /* KnownEventName.EventDispatch */, { category: 'Js' /* EventCategory.Js */, label: 'Event' }],
  [
    'RequestMainThreadFrame' /* KnownEventName.RequestMainThreadFrame */,
    { category: 'Js' /* EventCategory.Js */, label: 'Request Main Thread Frame' },
  ],
  [
    'RequestAnimationFrame' /* KnownEventName.RequestAnimationFrame */,
    { category: 'Js' /* EventCategory.Js */, label: 'Request Animation Frame' },
  ],
  [
    'CancelAnimationFrame' /* KnownEventName.CancelAnimationFrame */,
    { category: 'Js' /* EventCategory.Js */, label: 'Cancel Animation Frame' },
  ],
  [
    'FireAnimationFrame' /* KnownEventName.FireAnimationFrame */,
    { category: 'Js' /* EventCategory.Js */, label: 'Animation Frame' },
  ],
  [
    'RequestIdleCallback' /* KnownEventName.RequestIdleCallback */,
    { category: 'Js' /* EventCategory.Js */, label: 'Request Idle Callback' },
  ],
  [
    'CancelIdleCallback' /* KnownEventName.CancelIdleCallback */,
    { category: 'Js' /* EventCategory.Js */, label: 'Cancel Idle Callback' },
  ],
  [
    'FireIdleCallback' /* KnownEventName.FireIdleCallback */,
    { category: 'Js' /* EventCategory.Js */, label: 'Idle Callback' },
  ],
  [
    'TimerInstall' /* KnownEventName.TimerInstall */,
    { category: 'Js' /* EventCategory.Js */, label: 'Timer Installed' },
  ],
  ['TimerRemove' /* KnownEventName.TimerRemove */, { category: 'Js' /* EventCategory.Js */, label: 'Timer Removed' }],
  ['TimerFire' /* KnownEventName.TimerFire */, { category: 'Js' /* EventCategory.Js */, label: 'Timer Fired' }],
  [
    'WebSocketCreate' /* KnownEventName.WebSocketCreate */,
    { category: 'Js' /* EventCategory.Js */, label: 'Create WebSocket' },
  ],
  [
    'WebSocketSendHandshakeRequest' /* KnownEventName.WebSocketSendHandshake */,
    { category: 'Js' /* EventCategory.Js */, label: 'Send WebSocket Handshake' },
  ],
  [
    'WebSocketReceiveHandshakeResponse' /* KnownEventName.WebSocketReceiveHandshake */,
    { category: 'Js' /* EventCategory.Js */, label: 'Receive WebSocket Handshake' },
  ],
  [
    'WebSocketDestroy' /* KnownEventName.WebSocketDestroy */,
    { category: 'Js' /* EventCategory.Js */, label: 'Destroy WebSocket' },
  ],
  [
    'DoEncrypt' /* KnownEventName.CryptoDoEncrypt */,
    { category: 'Js' /* EventCategory.Js */, label: 'Crypto Encrypt' },
  ],
  [
    'DoEncryptReply' /* KnownEventName.CryptoDoEncryptReply */,
    { category: 'Js' /* EventCategory.Js */, label: 'Crypto Encrypt Reply' },
  ],
  [
    'DoDecrypt' /* KnownEventName.CryptoDoDecrypt */,
    { category: 'Js' /* EventCategory.Js */, label: 'Crypto Decrypt' },
  ],
  [
    'DoDecryptReply' /* KnownEventName.CryptoDoDecryptReply */,
    { category: 'Js' /* EventCategory.Js */, label: 'Crypto Decrypt Reply' },
  ],
  ['DoDigest' /* KnownEventName.CryptoDoDigest */, { category: 'Js' /* EventCategory.Js */, label: 'Crypto Digest' }],
  [
    'DoDigestReply' /* KnownEventName.CryptoDoDigestReply */,
    { category: 'Js' /* EventCategory.Js */, label: 'Crypto Digest Reply' },
  ],
  ['DoSign' /* KnownEventName.CryptoDoSign */, { category: 'Js' /* EventCategory.Js */, label: 'Crypto Sign' }],
  [
    'DoSignReply' /* KnownEventName.CryptoDoSignReply */,
    { category: 'Js' /* EventCategory.Js */, label: 'Crypto Sign Reply' },
  ],
  ['DoVerify' /* KnownEventName.CryptoDoVerify */, { category: 'Js' /* EventCategory.Js */, label: 'Crypto Verify' }],
  [
    'DoVerifyReply' /* KnownEventName.CryptoDoVerifyReply */,
    { category: 'Js' /* EventCategory.Js */, label: 'Crypto Verify Reply' },
  ],
  /* Gc */
  ['GCEvent' /* KnownEventName.GC */, { category: 'Gc' /* EventCategory.Gc */, label: 'GC' }],
  ['BlinkGC.AtomicPhase' /* KnownEventName.DOMGC */, { category: 'Gc' /* EventCategory.Gc */, label: 'DOM GC' }],
  [
    'V8.GCIncrementalMarking' /* KnownEventName.IncrementalGCMarking */,
    { category: 'Gc' /* EventCategory.Gc */, label: 'Incremental GC' },
  ],
  ['MajorGC' /* KnownEventName.MajorGC */, { category: 'Gc' /* EventCategory.Gc */, label: 'Major GC' }],
  ['MinorGC' /* KnownEventName.MinorGC */, { category: 'Gc' /* EventCategory.Gc */, label: 'Minor GC' }],
  /* Layout (a.k.a "Rendering") */
  [
    'ScheduleStyleRecalculation' /* KnownEventName.ScheduleStyleRecalculation */,
    { category: 'Layout' /* EventCategory.Layout */, label: 'Schedule Recalculate Style' },
  ],
  [
    'RecalculateStyles' /* KnownEventName.RecalculateStyles */,
    { category: 'Layout' /* EventCategory.Layout */, label: 'Recalculate Style' },
  ],
  ['Layout' /* KnownEventName.Layout */, { category: 'Layout' /* EventCategory.Layout */, label: 'Layout' }],
  [
    'UpdateLayoutTree' /* KnownEventName.UpdateLayoutTree */,
    { category: 'Layout' /* EventCategory.Layout */, label: 'Recalculate Style' },
  ],
  [
    'InvalidateLayout' /* KnownEventName.InvalidateLayout */,
    { category: 'Layout' /* EventCategory.Layout */, label: 'Invalidate Layout' },
  ],
  [
    'LayoutInvalidationTracking' /* KnownEventName.LayoutInvalidationTracking */,
    { category: 'Layout' /* EventCategory.Layout */, label: 'Layout Invalidation' },
  ],
  [
    'ComputeIntersections' /* KnownEventName.ComputeIntersections */,
    { category: 'Paint' /* EventCategory.Paint */, label: 'Compute Intersections' },
  ],
  ['HitTest' /* KnownEventName.HitTest */, { category: 'Layout' /* EventCategory.Layout */, label: 'Hit Test' }],
  ['PrePaint' /* KnownEventName.PrePaint */, { category: 'Layout' /* EventCategory.Layout */, label: 'Pre-Paint' }],
  /* Paint */
  ['ScrollLayer' /* KnownEventName.ScrollLayer */, { category: 'Paint' /* EventCategory.Paint */, label: 'Scroll' }],
  [
    'UpdateLayer' /* KnownEventName.UpdateLayer */,
    { category: 'Paint' /* EventCategory.Paint */, label: 'Update Layer' },
  ],
  ['PaintSetup' /* KnownEventName.PaintSetup */, { category: 'Paint' /* EventCategory.Paint */, label: 'Paint Setup' }],
  ['Paint' /* KnownEventName.Paint */, { category: 'Paint' /* EventCategory.Paint */, label: 'Paint' }],
  ['PaintImage' /* KnownEventName.PaintImage */, { category: 'Paint' /* EventCategory.Paint */, label: 'Paint Image' }],
  ['Commit' /* KnownEventName.Commit */, { category: 'Paint' /* EventCategory.Paint */, label: 'Commit' }],
  [
    'CompositeLayers' /* KnownEventName.CompositeLayers */,
    { category: 'Paint' /* EventCategory.Paint */, label: 'Composite Layers' },
  ],
  ['RasterTask' /* KnownEventName.RasterTask */, { category: 'Paint' /* EventCategory.Paint */, label: 'Raster' }],
  [
    'ImageDecodeTask' /* KnownEventName.ImageDecodeTask */,
    { category: 'Paint' /* EventCategory.Paint */, label: 'Decode Image Task' },
  ],
  [
    'ImageUploadTask' /* KnownEventName.ImageUploadTask */,
    { category: 'Paint' /* EventCategory.Paint */, label: 'Upload Image Task' },
  ],
  [
    'Decode Image' /* KnownEventName.DecodeImage */,
    { category: 'Paint' /* EventCategory.Paint */, label: 'Decode Image' },
  ],
  [
    'Resize Image' /* KnownEventName.ResizeImage */,
    { category: 'Paint' /* EventCategory.Paint */, label: 'Resize Image' },
  ],
  [
    'Draw LazyPixelRef' /* KnownEventName.DrawLazyPixelRef */,
    { category: 'Paint' /* EventCategory.Paint */, label: 'Draw LazyPixelRef' },
  ],
  [
    'Decode LazyPixelRef' /* KnownEventName.DecodeLazyPixelRef */,
    { category: 'Paint' /* EventCategory.Paint */, label: 'Decode LazyPixelRef' },
  ],
  ['GPUTask' /* KnownEventName.GPUTask */, { category: 'Paint' /* EventCategory.Paint */, label: 'GPU Task' }],
])

/**
 * Gets value for key, assigning a default if value is falsy.
 */
function getWithDefault(map: Map<any, any>, key: any, defaultValueFactory: (key: any) => any) {
  let value = map.get(key)
  if (!value) {
    value = defaultValueFactory(key)
    map.set(key, value)
  }
  return value
}

/**
 * Obtains the first or last item in the array that satisfies the predicate function.
 * So, for example, if the array were arr = [2, 4, 6, 8, 10], and you are looking for
 * the last item arr[i] such that arr[i] < 5  you would be returned 1, because
 * array[1] is 4, the last item in the array that satisfies the
 * predicate function.
 *
 * If instead you were looking for the first item in the same array that satisfies
 * arr[i] > 5 you would be returned 2 because array[2] = 6.
 *
 * Please note: this presupposes that the array is already ordered.
 */
function nearestIndex(arr: any[], predicate: (e: any) => boolean, searchStart?: 'BEGINNING' | 'END') {
  const searchFromEnd = searchStart === 'END' /* NearestSearchStart.END */
  if (arr.length === 0) {
    return null
  }
  let left = 0
  let right = arr.length - 1
  let pivot = 0
  let matchesPredicate = false
  let moveToTheRight = false
  let middle = 0
  do {
    middle = left + (right - left) / 2
    pivot = searchFromEnd ? Math.ceil(middle) : Math.floor(middle)
    matchesPredicate = predicate(arr[pivot])
    moveToTheRight = matchesPredicate === searchFromEnd
    if (moveToTheRight) {
      left = Math.min(right, pivot + (left === pivot ? 1 : 0))
    } else {
      right = Math.max(left, pivot + (right === pivot ? -1 : 0))
    }
  } while (right !== left)
  // Special-case: the indexed item doesn't pass the predicate. This
  // occurs when none of the items in the array are a match for the
  // predicate.
  if (!predicate(arr[left])) {
    return null
  }
  return left
}
/**
 * Obtains the first item in the array that satisfies the predicate function.
 * So, for example, if the array was arr = [2, 4, 6, 8, 10], and you are looking for
 * the first item arr[i] such that arr[i] > 5 you would be returned 2, because
 * array[2] is 6, the first item in the array that satisfies the
 * predicate function.
 *
 * Please note: this presupposes that the array is already ordered.
 */
function nearestIndexFromBeginning(arr: any[], predicate: (e: any) => boolean) {
  return nearestIndex(arr, predicate, 'BEGINNING' /* NearestSearchStart.BEGINNING */)
}

function isTraceEventComplete(event: TraceEvent) {
  return event.ph === 'X' /* Phase.COMPLETE */
}
function isTraceEventProfile(traceEventData: TraceEvent) {
  return traceEventData.name === 'Profile'
}
function isTraceEventProfileChunk(traceEventData: TraceEvent) {
  return traceEventData.name === 'ProfileChunk'
}

/**
 * Sorts all the events in place, in order, by their start time. If they have
 * the same start time, orders them by longest first.
 */
function sortTraceEventsInPlace(events: TraceEvent[]) {
  events.sort((a, b) => {
    const aBeginTime = a.ts
    const bBeginTime = b.ts
    if (aBeginTime < bBeginTime) {
      return -1
    }
    if (aBeginTime > bBeginTime) {
      return 1
    }
    const aDuration = a.dur ?? 0
    const bDuration = b.dur ?? 0
    const aEndTime = aBeginTime + aDuration
    const bEndTime = bBeginTime + bDuration
    if (aEndTime > bEndTime) {
      return -1
    }
    if (aEndTime < bEndTime) {
      return 1
    }
    return 0
  })
}

/**
 * Sorts samples in place, in order, by their start time.
 */
function sortProfileSamples(samples: { ts: number }[]) {
  samples.sort((a, b) => {
    const aBeginTime = a.ts
    const bBeginTime = b.ts
    if (aBeginTime < bBeginTime) {
      return -1
    }
    if (aBeginTime > bBeginTime) {
      return 1
    }
    return 0
  })
}
const KNOWN_BOUNDARIES = new Set([
  'Other' /* EventCategory.Other */,
  'V8' /* EventCategory.V8 */,
  'Js' /* EventCategory.Js */,
  'Gc' /* EventCategory.Gc */,
])
const ALLOWED_CALL_FRAME_CODE_TYPES = new Set([undefined, 'JS'])
const BANNED_CALL_FRAME_URL_REGS = [/^chrome-extension:\/\//, /^extensions::/]
const SAMPLING_INTERVAL = 200
const events = new Map()
const profiles = new Map()
const processes = new Map()
let handlerState = 1 /* HandlerState.UNINITIALIZED */
const makeSamplesProcess = () => ({
  threads: new Map(),
})
const makeSamplesThread = (profile: any) => ({
  profile,
})
const makeEmptyProfileTree = () => ({
  nodes: new Map(),
})
const makeEmptyProfileNode = (callFrame: any) => ({
  callFrame,
  parentId: null,
  childrenIds: new Set(),
})
const makeProfileSample = (nodeId: string, pid: string, tid: string, ts: number) => ({
  topmostStackFrame: { nodeId },
  tid,
  pid,
  ts,
})
const makeProfileCall = (nodeId: string, sample: TraceEvent) => ({
  stackFrame: { nodeId },
  tid: sample.tid,
  pid: sample.pid,
  ts: sample.ts,
  dur: 0,
  selfDur: 0,
  children: [] as any[],
})
const makeEmptyProfileFunction = (nodeId: string) => ({
  stackFrame: { nodeId },
  calls: [],
  durPercent: 0,
  selfDurPercent: 0,
})
const getOrCreateSamplesProcess = (processes: Map<any, any>, pid: string) => {
  return getWithDefault(processes, pid, makeSamplesProcess)
}
const getOrCreateSamplesThread = (process: { threads: Map<any, any> }, tid: string, profile: any) => {
  return getWithDefault(process.threads, tid, () => makeSamplesThread(profile))
}
export function reset() {
  events.clear()
  profiles.clear()
  processes.clear()
  handlerState = 1 /* HandlerState.UNINITIALIZED */
}
export function initialize() {
  if (handlerState !== 1 /* HandlerState.UNINITIALIZED */) {
    throw new Error('Samples Handler was not reset')
  }
  handlerState = 2 /* HandlerState.INITIALIZED */
}
export function handleEvent(event: TraceEvent) {
  if (handlerState !== 2 /* HandlerState.INITIALIZED */) {
    throw new Error('Samples Handler is not initialized')
  }
  if (isTraceEventProfile(event)) {
    const profile = getWithDefault(profiles, event.id, () => ({}))
    profile.head = event
    return
  }
  if (isTraceEventProfileChunk(event)) {
    const profile = getWithDefault(profiles, event.id, () => ({}))
    profile.chunks = profile.chunks ?? []
    profile.chunks.push(event)
    return
  }
  if (isTraceEventComplete(event)) {
    const process = getWithDefault(events, event.pid, () => new Map())
    const thread = getWithDefault(process, event.tid, () => [])
    thread.push(event)
  }
}
export function finalize() {
  if (handlerState !== 2 /* HandlerState.INITIALIZED */) {
    throw new Error('Samples Handler is not initialized')
  }
  buildProcessesAndThreads(profiles, processes)
  buildHierarchy(processes, events)
  handlerState = 3 /* HandlerState.FINALIZED */
}
export function data() {
  if (handlerState !== 3 /* HandlerState.FINALIZED */) {
    throw new Error('Samples Handler is not finalized')
  }
  return {
    profiles: new Map(profiles),
    processes: new Map(processes),
  }
}
/**
 * Builds processes and threads from the accumulated profile chunks. This is
 * done during finalize instead of during event handling because profile heads
 * and chunks are sometimes retrieved out of order, or are incomplete.
 */
function buildProcessesAndThreads(profiles: Map<any, any>, processes: Map<any, any>) {
  for (const [, profile] of profiles) {
    // Sometimes the trace includes empty profiles, or orphaned chunks, even
    // after going through all the trace events. Ignore.
    const { head, chunks } = profile
    if (!head || !chunks?.length) {
      continue
    }
    // Note: events are collected on a different thread than what's sampled.
    // The correct process and thread ids are specified by the profile.
    const pid = head.pid
    const tid = head.tid
    getOrCreateSamplesThread(getOrCreateSamplesProcess(processes, pid), tid, profile)
  }
}
/**
 * Converts the raw profile data into hierarchical and ordered structures from
 * the stack traces that were sampled during a recording. Each thread in each
 * process will contribute to their own individual profile.
 *
 * Our V8 profiler is a sampling profiler. This means that it probes the
 * program's call stack at regular intervals defined by the sampling frequency.
 * The raw profile data comes in as multiple events, from which a profile is
 * built.
 *
 * The generated data will be comprised of several parts:
 * 1. "tree": All the complete stack traces, represented by a tree whose roots
 *    are the bottomest stack frames of all stack traces.
 * 2. "samples": All the individual samples, as an ordered list where each item
 *    points to the topmost stack frame at a particular point in time.
 * 3. "calls": A list of profile calls, where each item represents multiple
 *    samples coalesced into a contiguous event. Each item will have a
 *    timestamp, duration, and refer to a stack frame and its child frames
 *    (all together forming multiple stack traces).
 */
function buildHierarchy(processes: Map<any, any>, events: Map<any, any>) {
  for (const [pid, process] of processes) {
    for (const [tid, thread] of process.threads) {
      // Step 1. Massage the data.
      sortTraceEventsInPlace(thread.profile.chunks)
      // ...and collect boundaries.
      const boundariesOptions = { filter: KNOWN_BOUNDARIES }
      const boundaries = (thread.boundaries = collectBoundaries(events, pid, tid, boundariesOptions))
      // Step 2. Collect all the complete stack traces into a tree.
      const tree = (thread.tree = collectStackTraces(thread.profile.chunks))
      // Step 3. Collect all the individual samples into a list.
      const { startTime } = thread.profile.head.args.data
      const samplesOptions = { filterCodeTypes: true, filterUrls: true }
      const samples = (thread.samples = collectSamples(
        pid,
        tid,
        startTime,
        tree,
        thread.profile.chunks,
        samplesOptions,
      ))
      // Step 4. Coalesce samples.
      const merge = mergeCalls(
        samples.map((sample) => buildProfileCallFromSample(tree, sample)),
        boundaries,
      )
      thread.calls = merge.calls
      thread.dur = merge.dur
    }
  }
}
/**
 * Builds an array of timestamps corresponding to the begin and end boundaries
 * of the events on the specified process and thread.
 *
 * Therefore we expect to reformulate a set of events which can be represented
 * hierarchically like:
 *
 * |=========== Task A ===============|== Task E ==|
 *   |=== Task B ===|== Task D ==|
 *     |= Task C =|
 *
 * ...into something ordered like below:
 *
 * | | |          | |                 |            |
 * |=========== Task A ===============|== Task E ==|
 * | |=== Task B ===|== Task D ==|    |            |
 * | | |= Task C =| |            |    |            |
 * | | |          | |            |    |            |
 * X X X          X X            X    X            X (boundaries)
 */
function collectBoundaries(events: Map<any, any>, pid: string, tid: string, options: any) {
  const process = events.get(pid)
  if (!process) {
    return []
  }
  const thread = process.get(tid)
  if (!thread) {
    return []
  }
  const boundaries = new Set<number>()
  for (const event of thread) {
    const category = KNOWN_EVENTS.get(event.name)?.category ?? 'Other' /* EventCategory.Other */
    if (!options.filter.has(category)) {
      continue
    }
    boundaries.add(event.ts)
    boundaries.add(event.ts + event.dur)
  }
  return [...boundaries].sort((a, b) => (a < b ? -1 : 1))
}
/**
 * Builds all the complete stack traces that exist in a particular thread of a
 * particular process. They will be stored as a tree. The roots of this tree are
 * the bottomest stack frames of all individual stack traces.
 *
 * The stack traces are retrieved in partial chains, each chain as part of a
 * trace event. This method collects the data into a single tree.
 *
 * Therefore we expect to reformulate something like:
 *
 * Chain 1: [A, B <- A, C <- B]
 * Chain 2: [D <- A, E <- D]
 * Chain 3: [G]
 * Chain 4: [F <- B]
 * Chain 5: [H <- G, I <- H]
 *
 * ...into something hierarchically-arranged like below:
 *
 *     A       G
 *    / \      |
 *   B   D     H
 *  / \   \    |
 * C   F   E   I
 */
function collectStackTraces(chunks: TraceEvent[], options?: any) {
  const tree = makeEmptyProfileTree()
  for (const chunk of chunks) {
    const cpuProfile = chunk.args.data?.cpuProfile
    if (!cpuProfile) {
      continue
    }
    const chain = cpuProfile.nodes
    if (!chain) {
      continue
    }
    for (const link of chain) {
      const nodeId = link.id
      const parentNodeId = link.parent
      const callFrame = link.callFrame
      // If the current call frame should not be part of the tree, then simply proceed
      // with the next call frame.
      if (!isAllowedCallFrame(callFrame, options)) {
        continue
      }
      const node = getWithDefault(tree.nodes, nodeId, () => makeEmptyProfileNode(callFrame))
      // If the call frame has no parent, then it's the bottomest stack frame of
      // a stack trace (aka a root).
      if (parentNodeId === undefined) {
        continue
      }
      // Otherwise, this call frame has a parent and threfore it's a stack frame
      // part of a larger stack trace. Each stack frame can only have a single
      // parent (called into by another unique stack frame), with multiple
      // children (calling into multiple unique stack frames). If a codepoint is
      // reached in multiple ways, multiple stack traces are created by V8.
      node.parentId = parentNodeId
      tree.nodes.get(parentNodeId)?.childrenIds.add(nodeId)
    }
  }
  return tree
}
/**
 * Collects all the individual samples that exist in a particular thread of a
 * particular process. They will be stored as an ordered list. Each entry
 * represents a sampled stack trace by pointing to the topmost stack frame at
 * that particular time.
 *
 * The samples are retrieved in buckets, each bucket as part of a trace event,
 * and each sample at a positive or negative delta cumulatively relative to the
 * profile's start time. This method collects the data into a single list.
 *
 * Therefore we expect to reformulate something like:
 *
 * Event 1 at 0µs: [A at Δ+1µs, A at Δ+2µs, B at Δ-1µs, C at Δ+2µs]
 * Event 2 at 9µs: [A at Δ+1µs, D at Δ+9µs, E at Δ-1µs]
 *
 * ...where each sample in each event points to the tompost stack frame at that
 * particular point in time (e.g. the first sample's tompost stack frame is A),
 * into something ordered like below:
 *
 * [A at 1µs, B at 2µs, A at 3µs, C at 4µs, A at 10µs, E at 18µs, D at 19µs]
 *
 * ...where each sample has an absolute timestamp, and the list is ordered.
 */
function collectSamples(pid: string, tid: string, ts: number, tree: any, chunks: TraceEvent[], options: any) {
  const samples = []
  for (const chunk of chunks) {
    const { timeDeltas, cpuProfile } = chunk.args.data ?? {}
    if (!timeDeltas || !cpuProfile) {
      continue
    }
    for (let i = 0; i < timeDeltas.length; i++) {
      const timeDelta = timeDeltas[i]
      const nodeId = cpuProfile.samples?.[i]
      // The timestamp of each sample is at a positive or negative delta,
      // cumulatively relative to the profile's start time.
      ts = ts + timeDelta
      // The call frame may not have been added to the stack traces tree (e.g.
      // if its code type or url was banned). If there is no allowed stack frame
      // as part of a stack trace, then this sample is dropped.
      const topmostAllowedNodeId = findTopmostAllowedCallFrame(nodeId as any, tree, options)
      if (topmostAllowedNodeId === null) {
        continue
      }
      // Otherwise, push the topmost allowed stack frame.
      samples.push(makeProfileSample(topmostAllowedNodeId, pid, tid, ts))
    }
  }
  sortProfileSamples(samples)
  return samples
}
/**
 * For a list of samples in a thread in a process, merges together stack frames
 * which have been sampled consecutively and which do not cross boundaries. The
 * samples and boundaries arrays are assumed to be sorted.
 *
 * Therefore, if the previously collected stack traces tree looks like this:
 *
 *   A   E
 *  / \
 * B   D
 * |
 * C
 *
 * ...we expect to reformulate something like:
 *
 * [A, B, C, C .. C, B, A, A .. A, D, D .. D, A, A .. A, E, E .. E]
 *
 * ...where each sample points to the tompost stack frame at that particular
 * point in time (e.g. the first sample's tompost stack frame is A, the last
 * sample's topmost stack frame is E, etc.), and thus the expanded samples array
 * can be represented as:
 *
 * +------------> (sample at time)
 * |
 * |A|A|A|A|A|A|A|A|A|A|A|A|A|A|A|A|A| |E|E|E|E|E|E|
 * | |B|B|B|B|B|B| |D|D|D|D|D|D| | | | | | | | | | |
 * | | |C|C|C|C| | | | | | | | | | | | | | | | | | |
 * |
 * V (stack trace depth)
 *
 * ...into something ordered like below:
 *
 * [ Call A ][ Call E ]
 *
 * ...where the hierarchy of these calls can be represented as:
 *
 * [-------- Call A --------][ Call E ]
 *  [- Call B -][- Call D -]
 *   [ Call C ]
 *
 * ...and where each call has an absolute timestamp and a duration.
 *
 * Considerations:
 *
 * 1. Consecutive stack frames which cross boundaries may not be coalesced.
 * "Boundaries" are an array of timestamps corresponding to the begin and end
 * of certain events (such as "RunTask").
 *
 * For example, we expect to reformulate something like:
 *
 *   (boundary)                                    (boundary)
 *       |                                             |
 * |A|A|A|A|A|A|A|A|A|A|A|A|A|A|A|A|A| |E|E|E|E|E|E|   |
 *       |                                             |
 *
 * ...into something ordered like below:
 *
 * [ Call A ][ Call A ][ Call E ]
 *
 * ... where the first Call A is before the first boundary, second Call A is
 * after the first boundary, and Call E is inbetween boundaries.
 *
 * 2. Consecutive stack frames which are part of different branches (a.k.a part
 * of a different stack trace) must not be coalesced, even if at the same depth.
 *
 * For example, with something like:
 *
 * +------------> (sample at time)
 * |
 * | ... |X|X|X|Z|Z|Z| ...
 * |         |Y|Y|
 * |
 * V (stack trace depth)
 *
 * ...or:
 *
 * +------------> (sample at time)
 * |
 * | ... |X|X|X|Z|X|X|X| ...
 * |         |Y| |Y|
 * |
 * V (stack trace depth)
 *
 * ...the Y stack frames must not be merged even if they have been sampled
 * close together, and even if they do not cross any boundaries (e.g. are part
 * of the same `RunTask`). This is because they are either:
 * - part of separate stack traces (and therefore would have different IDs), or
 * - separated by a different parent frame.
 */
function mergeCalls(calls: any[], boundaries: any[]) {
  const out = { calls: [] as any[], dur: 0 }
  let boundary = 0
  for (const call of calls) {
    // When the call crosses a boundary defined by any of the relevant trace
    // events (e.g. `RunTask`), even if the stack frame would be the same, start
    // a new merge with the current call as head, and find the next boundary.
    const isAcrossBoundary = call.ts >= boundary
    if (isAcrossBoundary) {
      const index = nearestIndexFromBeginning(boundaries, (ts) => ts > call.ts) ?? Infinity
      boundary = boundaries[index]
      out.calls.push(call)
      continue
    }
    // Otherwise, start a new merge if the call is a different stack frame, or
    // it was sampled too far into the future from the previous call.
    const previous = out.calls[out.calls.length - 1]
    const isSameStackFrame = call.stackFrame.nodeId === previous.stackFrame.nodeId
    const isSampledConsecutively = call.ts - (previous.ts + previous.dur) < SAMPLING_INTERVAL
    if (!isSameStackFrame || !isSampledConsecutively) {
      out.calls.push(call)
      continue
    }
    previous.dur = call.ts - previous.ts
    previous.children.push(...call.children)
  }
  for (const call of out.calls) {
    const merge = mergeCalls(call.children, boundaries)
    call.children = merge.calls
    call.selfDur = call.dur - merge.dur
    out.dur = out.dur + call.dur
  }
  return out
}
/**
 * Checks if the call frame is allowed (i.e. it may not be part of the collected
 * stack traces tree).
 */
function isAllowedCallFrame(callFrame: any, options?: any) {
  if (options?.filterCodeTypes && !ALLOWED_CALL_FRAME_CODE_TYPES.has(callFrame.codeType)) {
    return false
  }
  return !(options?.filterUrls && BANNED_CALL_FRAME_URL_REGS.some((re) => callFrame.url?.match(re)))
}
/**
 * Walks the stack traces tree until it finds a call frame that is allowed.
 */
function findTopmostAllowedCallFrame(nodeId: string, tree: any, options: any): string | null {
  if (nodeId === null) {
    return null
  }
  const node = tree.nodes.get(nodeId)
  const callFrame = node?.callFrame
  if (!node || !callFrame) {
    return null
  }
  if (!isAllowedCallFrame(callFrame, options)) {
    return findTopmostAllowedCallFrame(node.parentId, tree, options)
  }
  return nodeId
}
/**
 * Gets the stack trace associated with a sample. The topmost stack frame will
 * be the last entry of array. Aka the root stack frame will be the first.
 *
 * All the complete stack traces are stored as part of a profile tree. All the
 * samples point to the topmost stack frame. This method walks up the tree to
 * compose a stack trace.
 */
function buildStackTraceAsCallFrameIdsFromId(tree: any, nodeId: string) {
  const out = []
  let currentNodeId = nodeId
  let currentNode
  while (currentNodeId !== null && (currentNode = tree.nodes.get(currentNodeId))) {
    out.push(currentNodeId)
    currentNodeId = currentNode.parentId
  }
  return out.reverse()
}
/**
 * Just like `buildStackTrace`, but returns an array of call frames instead of ids.
 */
export function buildStackTraceAsCallFramesFromId(tree: any, nodeId: string) {
  const trace = buildStackTraceAsCallFrameIdsFromId(tree, nodeId)
  return trace.map((nodeId) => {
    const callFrame = tree.nodes.get(nodeId)?.callFrame
    if (!callFrame) {
      throw new Error()
    }
    return callFrame
  })
}
/**
 * Just like `buildStackTrace`, but returns a `ProfileCall` instead of an array.
 */
function buildProfileCallFromSample(tree: any, sample: any) {
  const trace = buildStackTraceAsCallFrameIdsFromId(tree, sample.topmostStackFrame.nodeId)
  const calls = trace.map((nodeId) => makeProfileCall(nodeId, sample))
  for (let i = 1; i < calls.length; i++) {
    const parent = calls[i - 1]
    const current = calls[i]
    parent.children.push(current)
  }
  return calls[0]
}
/**
 * Gets all functions that have been called between the given timestamps, each
 * with additional information:
 * - the call frame id, which points to a node containing the function name etc.
 * - all individual calls for that function
 * - percentage of time taken, relative to the given timestamps
 * - percentage of self time taken relative to the given timestamps
 */
function getAllFunctionsBetweenTimestamps(calls: any[], begin: number, end: number, out = new Map()) {
  for (const call of calls) {
    if (call.ts < begin || call.ts + call.dur > end) {
      continue
    }
    const func = getWithDefault(out, call.stackFrame.nodeId, () => makeEmptyProfileFunction(call.stackFrame.nodeId))
    func.calls.push(call)
    func.durPercent += (call.dur / (end - begin)) * 100
    func.selfDurPercent += (call.selfDur / (end - begin)) * 100
    getAllFunctionsBetweenTimestamps(call.children, begin, end, out)
  }
  return out.values()
}
/**
 * Gets all the hot functions between timestamps, each with information about
 * the relevant call frame, time, self time, and percentages.
 *
 * The hot functions are sorted by self time.
 */
export function getAllHotFunctionsBetweenTimestamps(calls: any[], begin: number, end: number, minSelfPercent: number) {
  const functions = getAllFunctionsBetweenTimestamps(calls, begin, end)
  const hot = [...functions].filter((info) => info.selfDurPercent >= minSelfPercent)
  return hot.sort((a, b) => (a.selfDurPercent > b.selfDurPercent ? -1 : 1))
}
