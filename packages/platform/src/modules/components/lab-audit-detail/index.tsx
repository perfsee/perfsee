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

import { useRef, useLayoutEffect } from 'react'

import { CollapsiblePanel } from '@perfsee/components'

import { LighthouseAudit } from '../../snapshots/snapshot-type'

import { AuditDetailContainer } from './style'

const { DetailsRenderer } = require('./renderer/details-renderer')
const { DOM } = require('./renderer/dom')

require('./renderer/styles.css')

export type DetailProps = Pick<LighthouseAudit, 'details'> & {
  entities?: LH.Result.Entities
  fullPageScreenshot?: LH.Result.FullPageScreenshot
}

export const LabAuditDetail = (props: DetailProps) => {
  const { details, entities, fullPageScreenshot } = props
  const containerRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (containerRef.current) {
      const elem = new DetailsRenderer(new DOM(document, containerRef.current), {
        entities,
        fullPageScreenshot,
      }).render(details)
      elem && containerRef.current.appendChild(elem)
    }
  }, [entities, fullPageScreenshot, details])

  return <AuditDetailContainer ref={containerRef} />
}

export const LabAuditDetailWithPanel = (props: DetailProps) => {
  const { details } = props
  if (
    // @ts-expect-error
    (!details?.items?.length && !details?.nodes?.length && !details?.chains && !details?.data) ||
    details.type === 'debugdata'
  ) {
    return null
  }

  return (
    <CollapsiblePanel header="Detail">
      <LabAuditDetail {...props} />
    </CollapsiblePanel>
  )
}
