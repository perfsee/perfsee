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

import { Stack } from '@fluentui/react'
import { FC } from 'react'

import { AuditItemDetail } from '@perfsee/bundle-report/bundle-detail/resource-tabs/audits'
import { CollapsiblePanel, ForeignLink, formatMDLink } from '@perfsee/components'
import { LabAuditDetail } from '@perfsee/lab-report/lab-audit-detail'
import { LighthouseAudit } from '@perfsee/lab-report/snapshot-type'
import { BundleAuditResult } from '@perfsee/shared'

import { VersionIssue } from '../types'

import { IssueInfo } from './issue'
import {
  AuditItem,
  AuditItemDesc,
  AuditsDetailIconWrap,
  ErrorAuditDesc,
  ErrorIcon,
  GoodIcon,
  WarningIcon,
} from './styled'

export interface LongTaskAuditProps {
  issue?: VersionIssue
}

interface BundleAuditProps {
  audits: BundleAuditResult[]
}

interface LabAuditProps extends LongTaskAuditProps {
  audits: LighthouseAudit[]
}

export const BundleAudits: FC<BundleAuditProps> = ({ audits }) => {
  return (
    <Stack>
      {audits.map((audit) => (
        <BundleAuditItem key={audit.id} audit={audit} />
      ))}
    </Stack>
  )
}

export const LabAudits: FC<LabAuditProps> = ({ audits, issue }) => {
  return (
    <Stack>
      <LongTaskAudit issue={issue} />
      {audits.map((audit) => (
        <LabAuditItem key={audit.id} audit={audit} />
      ))}
    </Stack>
  )
}

const BundleAuditItem = ({ audit }: { audit: BundleAuditResult }) => {
  const header = (
    <Stack horizontal tokens={{ padding: '0 4px' }}>
      <AuditsDetailIconWrap>{audit.score < 1 ? <ErrorIcon /> : <WarningIcon />}</AuditsDetailIconWrap>
      {audit.title}
    </Stack>
  )

  return (
    <AuditItem key={audit.id}>
      <CollapsiblePanel iconPosition="right" header={header}>
        <AuditItemDesc>
          {audit.desc}
          <ForeignLink href={audit.link}>Learn more.</ForeignLink>
        </AuditItemDesc>
        {audit.detail && <AuditItemDetail detail={audit.detail} />}
      </CollapsiblePanel>
    </AuditItem>
  )
}

const LabAuditItem = ({ audit }: { audit: LighthouseAudit }) => {
  const header = (
    <Stack horizontal tokens={{ padding: '0 4px' }}>
      <AuditsDetailIconWrap>
        <ErrorIcon />
      </AuditsDetailIconWrap>
      {audit.title}
      {audit.displayValue && <ErrorAuditDesc> -- {audit.displayValue}</ErrorAuditDesc>}
    </Stack>
  )

  return (
    <AuditItem key={audit.title}>
      <CollapsiblePanel iconPosition="right" header={header}>
        <AuditItemDesc>{formatMDLink(audit.description)}</AuditItemDesc>
        <LabAuditDetail details={audit.details} />
      </CollapsiblePanel>
    </AuditItem>
  )
}

export const LongTaskAudit = ({ issue }: LongTaskAuditProps) => {
  if (!issue || !issue.issues?.length) {
    return null
  }

  const header = (
    <Stack horizontal tokens={{ padding: '0 4px' }}>
      <AuditsDetailIconWrap>
        <ErrorIcon />
      </AuditsDetailIconWrap>
      There exist Long Tasks <ErrorAuditDesc> -- {issue.issues.length} tasks found</ErrorAuditDesc>
    </Stack>
  )
  return (
    <AuditItem>
      <CollapsiblePanel iconPosition="right" header={header}>
        <IssueInfo issue={issue} />
      </CollapsiblePanel>
    </AuditItem>
  )
}

export const NoAudit = () => {
  return (
    <Stack horizontal tokens={{ padding: '10px 0 0 8px' }}>
      <AuditsDetailIconWrap>
        <GoodIcon />
      </AuditsDetailIconWrap>
      No audits.
    </Stack>
  )
}
