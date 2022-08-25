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

import { diffLines } from 'diff'
import { Position } from 'vscode'

import Logger from './logger'

export type DiffContext = Readonly<ReturnType<typeof createDiffContext>>

export const createDiffContext = Logger.trace('createDiffContext')((before: string, after: string) => {
  const changes = diffLines(before, after)

  function diffLine<T extends number | number[]>(beforeLine: T): T extends number ? number | null : (number | null)[] {
    const isReturnList = beforeLine instanceof Array

    let beforeLineList
    if (beforeLine instanceof Array) {
      beforeLineList = beforeLine
    } else {
      beforeLineList = [beforeLine]
    }

    const result: (number | null)[] = new Array(beforeLineList.length).fill(-1)

    let resolvedCount = 0

    let beforePoint = -1
    let afterPoint = -1
    for (const change of changes) {
      const lineNum = change.count!

      if (change.removed) {
        beforePoint += lineNum
        beforeLineList.forEach((beforeLine, index) => {
          if (result[index] === -1 && beforePoint >= beforeLine) {
            result[index] = null
            resolvedCount++
          }
        })
      } else if (change.added) {
        afterPoint += lineNum
      } else {
        beforePoint += lineNum
        afterPoint += lineNum

        beforeLineList.forEach((beforeLine, index) => {
          if (result[index] === -1 && beforePoint >= beforeLine) {
            result[index] = afterPoint - lineNum + (beforeLine - (beforePoint - lineNum))
            resolvedCount++
          }
        })
      }

      if (resolvedCount === beforeLineList.length) return (isReturnList ? result : result[0]) as any
    }
    const finalResult = result.map((value) => (value === -1 ? null : value))
    return (isReturnList ? finalResult : finalResult[0]) as any
  }

  function diffPosition<T extends Position | Position[]>(
    beforePosition: T,
  ): T extends Position ? Position | null : (Position | null)[] {
    const beforeLine =
      beforePosition instanceof Array ? beforePosition.map((pos) => pos.line) : (beforePosition as Position).line
    const afterLine = diffLine(beforeLine as number | number[])

    if (afterLine instanceof Array) {
      return (beforePosition as Position[]).map((pos, index) =>
        afterLine[index] !== null ? pos.with(afterLine[index]!) : null,
      ) as any
    } else {
      return (afterLine !== null ? (beforePosition as Position).with(afterLine as number) : null) as any
    }
  }

  return {
    diffLine: Logger.trace('diffLine')(diffLine),
    diffPosition: Logger.trace('diffPosition')(diffPosition),
  }
})

export const diffLine: <T extends number | number[]>(
  before: string,
  after: string,
  beforeLine: T,
) => T extends number ? number | null : (number | null)[] = (before, after, beforeLine) => {
  const diffContext = createDiffContext(before, after)
  return diffContext.diffLine(beforeLine)
}

export const diffPosition: <T extends Position | Position[]>(
  before: string,
  after: string,
  beforePosition: T,
) => T extends Position ? Position | null : (Position | null)[] = (before, after, beforePosition) => {
  const diffContext = createDiffContext(before, after)
  return diffContext.diffPosition(beforePosition)
}
