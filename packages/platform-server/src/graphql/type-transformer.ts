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

import { PipeTransform } from '@nestjs/common'
import { TypeMetadataStorage } from '@nestjs/graphql'

export const transformInputType: PipeTransform = {
  transform(val, meta) {
    if (!meta.metatype) {
      return val
    }

    let classRef = meta.metatype
    const targets = []

    while (classRef && classRef !== Object) {
      const metadata = TypeMetadataStorage.getInputTypeMetadataByTarget(classRef)
      if (metadata) {
        targets.push(metadata)
        classRef = Object.getPrototypeOf(classRef)
      } else {
        break
      }
    }

    const transformedVal = {}

    targets.reverse().forEach((target) =>
      target.properties?.forEach((prop) => {
        if (prop.schemaName in val) {
          transformedVal[prop.name] = val[prop.schemaName]
        }
      }),
    )

    return transformedVal
  },
}
