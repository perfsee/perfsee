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

import { faker } from '@faker-js/faker'
import { omit, pick } from 'lodash'

import { Artifact, ArtifactEntrypoint, ArtifactName, Project } from '@perfsee/platform-server/db'
import { EventEmitter } from '@perfsee/platform-server/event'
import { Metric } from '@perfsee/platform-server/metrics'
import test, { createMock, initTestDB, createDBTestingModule, create } from '@perfsee/platform-server/test'
import { BundleJobStatus, JobType } from '@perfsee/server-common'
import { Size } from '@perfsee/shared'

import { CheckSuiteService } from '../../checksuite/service'
import { NotificationService } from '../../notification/service'
import { ArtifactService } from '../service'

let project: Project

test.beforeEach(async (t) => {
  t.context.module = await createDBTestingModule({
    providers: [ArtifactService],
  })
    .useMocker(createMock)
    .compile()

  await initTestDB()

  project = await Project.findOneByOrFail({ id: 1 })
})

test.serial('create new artifact', async (t) => {
  const service = t.context.module.get(ArtifactService)
  const checkSuiteService = t.context.module.get(CheckSuiteService)
  const event = t.context.module.get(EventEmitter)

  const entity: Partial<Artifact> = {
    iid: 1,
    name: faker.datatype.string(),
    hash: faker.git.commitSha(),
    branch: faker.git.branch(),
    issuer: faker.internet.email(),
    buildKey: faker.datatype.string(),
    isBaseline: false,
  }

  const { id } = await service.create(project, entity)

  const artifact = await Artifact.findOneBy({ id })
  const artifactName = await ArtifactName.findOneBy({ projectId: project.id, name: entity.name })

  t.truthy(artifact)
  t.truthy(artifactName)
  t.truthy(checkSuiteService.startBundleCheck.calledOnce)
  t.truthy(
    event.emitAsync.calledWith('job.create', {
      type: JobType.BundleAnalyze,
      payload: { entityId: id, projectId: project.id },
    }),
  )

  t.is(artifact?.projectId, project.id)
  t.deepEqual(
    pick(artifact, ['iid', 'name', 'hash', 'branch', 'issuer', 'buildKey', 'isBaseline']),
    omit(entity, ['baselineId', 'project']),
  )
  t.falsy(artifact?.baselineId)
})

test.serial('get last available baseline', async (t) => {
  const service = t.context.module.get(ArtifactService)
  const artifactName = faker.datatype.string()

  const none = await service.getLastAvailableBaseline(project.id, artifactName)
  t.falsy(none)

  const baseline = await create(Artifact, {
    projectId: project.id,
    name: artifactName,
    isBaseline: true,
    status: BundleJobStatus.Passed,
  })

  const found = await service.getLastAvailableBaseline(project.id, artifactName)
  t.is(found?.id, baseline.id)
})

test.serial('get artifacts', async (t) => {
  const { id: projectId } = await create(Project)
  const service = t.context.module.get(ArtifactService)

  const [, count] = await service.getArtifacts(projectId, { first: 10, skip: 0, after: null })

  t.is(count, 0)

  const name = faker.datatype.string()
  const branch = faker.datatype.string()
  const hash = faker.git.commitSha()

  const artifact = await create(Artifact, {
    projectId: projectId,
    name,
    branch,
    hash,
  })

  const [results2, count2] = await service.getArtifacts(projectId, { first: 10, skip: 0, after: null }, branch)
  t.is(count2, 1)
  t.deepEqual(results2[0], artifact)

  const [results3, count3] = await service.getArtifacts(projectId, { first: 10, skip: 0, after: null }, undefined, name)
  t.is(count3, 1)
  t.deepEqual(results3[0], artifact)

  const [results4, count4] = await service.getArtifacts(
    projectId,
    { first: 10, skip: 0, after: null },
    undefined,
    undefined,
    hash,
  )
  t.is(count4, 1)
  t.deepEqual(results4[0], artifact)
})

test.serial('get artifact by iid', async (t) => {
  const service = t.context.module.get(ArtifactService)
  const iid = faker.datatype.number()
  const artifact = await create(Artifact, { projectId: project.id, iid })

  const result = await service.getArtifactByIid(project.id, iid)

  t.is(result?.id, artifact.id)
})

test.serial('get artifact count', async (t) => {
  const service = t.context.module.get(ArtifactService)
  const { id: projectId } = await create(Project)

  const count = await service.getArtifactCount(projectId)
  t.is(count, 0)

  await create(Artifact, { projectId })
  const count2 = await service.getArtifactCount(projectId)
  t.is(count2, 1)
})

test.serial('get baseline artifact', async (t) => {
  const service = t.context.module.get(ArtifactService)

  const baseline = await create(Artifact, {
    project,
    isBaseline: true,
  })
  const artifact = await create(Artifact, {
    project,
    baselineId: baseline.id,
  })

  const result = await service.getBaselineArtifact(artifact.id)

  t.is(result?.id, baseline.id)
})

test.serial('on job update', async (t) => {
  const service = t.context.module.get(ArtifactService)
  const checkSuiteService = t.context.module.get(CheckSuiteService)
  const notificationService = t.context.module.get(NotificationService)
  const metrics = t.context.module.get(Metric)

  const artifact = await create(Artifact, { project, name: faker.datatype.string() })

  // running status
  await service.handleJobUpdated({ artifactId: artifact.id, status: BundleJobStatus.Running })
  const artifact2 = await Artifact.findOneBy({ id: artifact.id })

  t.is(artifact2?.status, BundleJobStatus.Running)
  t.truthy(checkSuiteService.runBundleCheck.calledOnce)
  t.truthy(notificationService.sendBundleJobNotification.calledOnce)

  // complete status
  const size: Size = {
    raw: faker.datatype.number(),
    gzip: faker.datatype.number(),
    brotli: faker.datatype.number(),
  }
  const bundleEntrypoint = {
    name: 'main',
    warnings: [],
    sizeDiff: {
      current: size,
      baseline: size,
    },
    initialSizeDiff: {
      current: size,
      baseline: size,
    },
    score: {
      current: faker.datatype.number(),
      baseline: 0,
    },
  } as any
  const updates = {
    reportKey: faker.datatype.string(),
    contentKey: faker.datatype.string(),
    entryPoints: { main: bundleEntrypoint },
    duration: faker.datatype.number(),
    score: 10,
    totalSize: { raw: 0, gzip: 0, brotli: 0 } as Size,
  }
  await service.handleJobUpdated({ artifactId: artifact.id, status: BundleJobStatus.Passed, ...updates })
  const artifact3 = await Artifact.findOneBy({ id: artifact.id })
  const entrypoint = await ArtifactEntrypoint.findOneBy({ projectId: project.id, artifactId: artifact.id })

  t.is(artifact3?.status, BundleJobStatus.Passed)
  t.truthy(entrypoint)
  t.is(entrypoint?.entrypoint, 'main')
  t.is(entrypoint?.score, bundleEntrypoint.score.current)
  t.truthy(metrics.bundleComplete.calledOnce)

  // fail
  const failedReason = faker.datatype.string()
  await service.handleJobUpdated({ artifactId: artifact.id, status: BundleJobStatus.Failed, failedReason, duration: 0 })

  const artifact4 = await Artifact.findOneBy({ id: artifact.id })
  t.is(artifact4?.status, BundleJobStatus.Failed)
  t.is(artifact4?.failedReason, failedReason)
  t.truthy(metrics.bundleFail.calledOnce)
})

test.serial('on job failed', async (t) => {
  const service = t.context.module.get(ArtifactService)
  const artifact = await create(Artifact, { projectId: project.id })

  const reason = faker.datatype.string()
  await service.handleJobFailed(artifact.id, reason)

  const artifact2 = await Artifact.findOneBy({ id: artifact.id })
  t.is(artifact2?.status, BundleJobStatus.Failed)
  t.is(artifact2?.failedReason, reason)
})

test.serial('get bundle job payload', async (t) => {
  const service = t.context.module.get(ArtifactService)

  const reportKey = faker.datatype.string()
  const buildKey = faker.datatype.string()

  const baseline = await create(Artifact, { projectId: project.id, isBaseline: true, reportKey })
  const artifact = await create(Artifact, { projectId: project.id, baselineId: baseline.id, buildKey })

  const payload = await service.getJobPayload(artifact.id)

  t.deepEqual(payload, { artifactId: artifact.id, buildKey, baselineReportKey: reportKey })
})
