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

import { Injectable, NotFoundException, OnApplicationBootstrap } from '@nestjs/common'
import { In } from 'typeorm'

import { AppVersion, Artifact, ArtifactEntrypoint, ArtifactName, Project } from '@perfsee/platform-server/db'
import { EventEmitter } from '@perfsee/platform-server/event'
import { AnalyzeUpdateType } from '@perfsee/platform-server/event/type'
import { PaginationInput } from '@perfsee/platform-server/graphql'
import { Logger } from '@perfsee/platform-server/logger'
import { Metric } from '@perfsee/platform-server/metrics'
import { ObjectStorage } from '@perfsee/platform-server/storage'
import { createDataLoader } from '@perfsee/platform-server/utils'
import { BundleJobPayload, BundleJobUpdate, BundleJobStatus, JobType } from '@perfsee/server-common'
import type { BundleResult, ModuleMap } from '@perfsee/shared'

import { ProjectUsageService } from '../project-usage/service'
import { ScriptFileService } from '../script-file/service'

@Injectable()
export class ArtifactService implements OnApplicationBootstrap {
  loader = createDataLoader((ids: number[]) =>
    Artifact.findBy({
      id: In(ids),
    }),
  )

  constructor(
    private readonly event: EventEmitter,
    private readonly logger: Logger,
    private readonly storage: ObjectStorage,
    private readonly metric: Metric,
    private readonly scriptFile: ScriptFileService,
    private readonly projectUsage: ProjectUsageService,
  ) {}

  onApplicationBootstrap() {
    this.event.emit('job.register_payload_getter', JobType.BundleAnalyze, this.getJobPayload.bind(this))
  }

  async create(project: Project, input: Partial<Artifact>) {
    const baseline = await this.getLastAvailableBaseline(project.id, input.name!)
    input.project = project
    input.baselineId = baseline?.id
    const artifact = await Artifact.create<Artifact>(input).save()

    await ArtifactName.record(project.id, artifact.name)
    await this.dispatchJob(artifact)
    this.event.emit(`${AnalyzeUpdateType.ArtifactUpdate}.${BundleJobStatus.Pending}`, { project, artifact })

    return artifact
  }

  async getArtifactNames(id: number) {
    return (await ArtifactName.findBy({ projectId: id })).map((name) => name.name)
  }

  async getEntrypointVersion(entrypoint: ArtifactEntrypoint) {
    return AppVersion.findOneBy({
      hash: entrypoint.hash,
      projectId: entrypoint.projectId,
    })
  }

  async getLastAvailableBaseline(projectId: number, artifactName: string): Promise<Pick<Artifact, 'id'> | null> {
    return Artifact.findOne({
      where: {
        projectId,
        isBaseline: true,
        status: BundleJobStatus.Passed,
        name: artifactName,
      },
      select: ['id'],
      order: { id: 'DESC' },
    })
  }

  async getArtifactByIid(projectId: number, iid: number) {
    return Artifact.findOneBy({ projectId, iid })
  }

  async getArtifacts(
    projectId: number,
    { first, after, skip }: PaginationInput,
    branch?: string,
    name?: string,
    hash?: string,
    isBaseline?: boolean,
  ) {
    const query = Artifact.createQueryBuilder('artifact').where('artifact.project_id = :projectId', { projectId })

    if (after) {
      query.andWhere('artifact.id < :after', { after })
    }

    if (branch) {
      query.andWhere('artifact.branch = :branch', { branch })
    }

    if (isBaseline) {
      query.andWhere('artifact.is_baseline = true')
    }

    if (name) {
      query.andWhere('artifact.name like :name', {
        name: `%${name.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_')}%`,
      })
    }

    if (hash) {
      query.andWhere('artifact.hash = :hash', { hash })
    }

    return query
      .leftJoinAndMapOne('artifact.version', AppVersion, 'version', 'version.hash = artifact.hash')
      .orderBy('artifact.id', 'DESC')
      .skip(skip)
      .take(first ?? 10)
      .getManyAndCount()
  }

  async getEntrypoints(
    projectId: number | undefined,
    { first, after, skip }: PaginationInput,
    from?: Date,
    to?: Date,
    branch?: string,
    artifactName?: string,
    name?: string,
    hash?: string,
    version?: string,
  ) {
    const query = ArtifactEntrypoint.createQueryBuilder('entrypoint')

    if (projectId) {
      query.where('entrypoint.project_id = :projectId', { projectId })
    }

    if (after) {
      query.andWhere('entrypint.id > :after', { after })
    }

    if (branch) {
      query.andWhere('entrypoint.branch = :branch', { branch })
    }

    if (name) {
      query.andWhere('entrypoint.entrypoint = :name', { name })
    }

    if (artifactName) {
      query.andWhere('entrypoint.artifact_name = :artifactName', { artifactName })
    }

    if (hash) {
      query.andWhere('entrypoint.hash = :hash', { hash })
    }

    if (from && to) {
      query.andWhere('entrypoint.created_at between :from and :to', { from, to })
    }

    if (version) {
      query
        .leftJoinAndMapOne(
          'entrypoint.version',
          AppVersion,
          'version',
          'version.hash = entrypoint.hash and version.project_id = entrypoint.project_id',
        )
        .andWhere('version.version = :version', { version })
    }

    return query
      .orderBy('entrypoint.id', 'DESC')
      .skip(skip)
      .take(first ?? 10)
      .getManyAndCount()
  }

  /**
   * @deprecated use getArtifacts
   */
  async getArtifactByCommit(projectId: number, hash: string) {
    const query = Artifact.createQueryBuilder('artifact')
      .where('artifact.project_id = :projectId', { projectId })
      .andWhere('artifact.hash = :hash', { hash })
    return query.getOne()
  }

  getArtifactEntrypoints(artifactId: number) {
    return ArtifactEntrypoint.findBy({ artifactId })
  }

  async getHistory(
    projectId: number,
    branch: string,
    artifactName?: string,
    from?: Date,
    to?: Date,
    first?: number,
    isBaseline?: boolean,
  ) {
    const builder = ArtifactEntrypoint.createQueryBuilder().where('project_id = :projectId', { projectId })

    if (branch) {
      if (isBaseline) {
        const artifact = await Artifact.findOne({ where: { projectId, isBaseline }, order: { id: 'DESC' } })
        if (artifact) {
          builder.andWhere('branch = :branch', { branch: artifact.branch })
        }
      } else {
        builder.andWhere('branch = :branch', { branch })
      }
    }

    if (artifactName) {
      builder.andWhere('artifact_name = :artifactName', { artifactName })
    }

    if (first) {
      const entrypointCount = await builder
        .clone()
        .select(['count(distinct entrypoint) as count', 'artifact_name as artifactName'])
        .groupBy('artifact_name')
        .getRawMany<{ artifact_name: string; count: string }>()

      if (!entrypointCount.length) {
        return []
      }

      builder.take(first * entrypointCount.reduce((sum, { count }) => sum + parseInt(count), 0))
    }

    if (from && to) {
      builder.andWhere('created_at between :from and :to', { from, to })
    }

    return builder.orderBy('id', 'DESC').getMany()
  }

  async getBaselineArtifact(artifactId: number) {
    const baselineId = (await Artifact.createQueryBuilder()
      .select(['baseline_id'])
      .where('id = :artifactId', { artifactId })
      .getRawOne<{ baseline_id?: number }>())!.baseline_id

    if (baselineId) {
      return this.loader.load(baselineId)
    }
  }

  getArtifactCount(projectId: number) {
    return Artifact.countBy({ projectId })
  }

  async handleJobUpdated(update: BundleJobUpdate) {
    this.logger.log(`receive artifact update [id=${update.artifactId}]`)
    const artifact = await this.loader.load(update.artifactId)

    if (!artifact) {
      throw new NotFoundException(`artifact with id ${update.artifactId} not found`)
    }

    artifact.status = update.status
    if (update.status === BundleJobStatus.Passed) {
      artifact.reportKey = update.reportKey!
      artifact.contentKey = update.contentKey!
      artifact.moduleMapKey = update.moduleMapKey!
      artifact.moduleSourceKey = update.moduleReasonsKey!
      artifact.duration = update.duration!
      artifact.score = update.score!
      artifact.size = update.totalSize!
    } else if (update.status === BundleJobStatus.Failed) {
      artifact.failedReason = update.failedReason!
    }

    await Artifact.getRepository().manager.transaction(async (manager) => {
      await manager.save(artifact, { reload: false })
      if ('entryPoints' in update) {
        await manager.delete(ArtifactEntrypoint, { artifactId: artifact.id })
        await manager.save(
          Object.entries(update.entryPoints).map(([name, data]) =>
            ArtifactEntrypoint.create({
              artifact,
              artifactName: artifact.name,
              projectId: artifact.projectId,
              branch: artifact.branch,
              hash: artifact.hash,
              entrypoint: name,
              size: data.sizeDiff.current,
              baselineSize: data.sizeDiff.baseline,
              initialSize: data.initialSizeDiff.current,
              baselineInitialSize: data.initialSizeDiff.baseline,
              score: data.score.current,
            }),
          ),
        )
      }
    })

    if (update.status === BundleJobStatus.Passed && update.scripts?.length) {
      await this.scriptFile.recordScriptFile(artifact.projectId, artifact.id, artifact.name, update.scripts)
    }

    const project = await Project.findOneByOrFail({ id: artifact.projectId })
    const baseline = artifact.baselineId ? await this.loader.load(artifact.baselineId) : undefined
    this.tapMetrics(artifact)
    this.event.emit(`${AnalyzeUpdateType.ArtifactUpdate}.${update.status}`, {
      project,
      artifact,
      bundleJobResult: update,
      baselineArtifact: baseline,
    })
  }

  async handleJobFailed(artifactId: number, reason: string) {
    const artifact = await this.loader.load(artifactId)
    if (!artifact) {
      throw new NotFoundException(`artifact with id ${artifactId} not found`)
    }

    artifact.status = BundleJobStatus.Failed
    artifact.failedReason = reason

    await artifact.save({ reload: false })
    const project = await Project.findOneByOrFail({ id: artifact.projectId })
    const baseline = artifact.baselineId ? await this.loader.load(artifact.baselineId) : undefined

    this.event.emit(`${AnalyzeUpdateType.ArtifactUpdate}.${BundleJobStatus.Failed}`, {
      artifact,
      baselineArtifact: baseline,
      project,
      bundleJobResult: {
        artifactId,
        status: BundleJobStatus.Failed,
        failedReason: reason,
        duration: 0,
      },
    })
  }

  async handleJobUpload(artifactId: number, uploadSize: number) {
    const report = await Artifact.findOneByOrFail({ id: artifactId })

    await this.projectUsage.recordStorageUsage(report.projectId, uploadSize)
    await this.updateArtifactUploadSize(report, uploadSize)
  }

  async dispatchJob(artifact: Artifact) {
    if (artifact.status !== BundleJobStatus.Pending) {
      artifact.status = BundleJobStatus.Pending
      await artifact.save()
    }

    await this.event.emitAsync('job.create', {
      type: JobType.BundleAnalyze,
      payload: { entityId: artifact.id, projectId: artifact.projectId },
    })
  }

  async getJobPayload(artifactId: number): Promise<BundleJobPayload> {
    const artifact = await this.loader.load(artifactId)
    if (!artifact) {
      throw new NotFoundException(`artifact with id ${artifactId} not found`)
    }

    const baseline = await this.getBaselineArtifact(artifactId)
    return {
      artifactId,
      buildKey: artifact.buildKey,
      baselineReportKey: baseline?.reportKey,
    }
  }

  async deleteArtifactById(projectId: number, iid: number) {
    const artifact = await Artifact.findOneByOrFail({ iid, projectId })
    await Artifact.delete(artifact.id)
    await this.projectUsage.recordStorageUsage(projectId, -artifact.uploadSize)
    await this.storage.bulkDelete(
      [artifact.buildKey, artifact.contentKey, artifact.reportKey, artifact.moduleMapKey].filter(Boolean) as string[],
    )

    return true
  }

  async getCommonModules(projectId: number, artifactIids: number[]) {
    const artifacts = await Artifact.createQueryBuilder()
      .where('project_id = :projectId', { projectId })
      .andWhere('iid in (:...artifactIds)', { artifactIds: artifactIids })
      .getMany()

    const commonModuleMap = new Map<
      string,
      Map<
        string,
        {
          id: number
          name: string
          entrypoints: string[]
        }
      >
    >()
    for (const artifact of artifacts) {
      if (!artifact.reportKey || !artifact.moduleMapKey) {
        throw new NotFoundException(`artifact with id ${artifact.id} not found`)
      }
      const report: BundleResult = JSON.parse((await this.storage.get(artifact.reportKey)).toString())
      const moduleMap: ModuleMap = JSON.parse((await this.storage.get(artifact.moduleMapKey)).toString())
      const assets = report.assets
      const assetRefEntryPointsMap = new Map<number, string[]>()

      for (const entryPoint of report.entryPoints) {
        for (const assetRef of entryPoint.assetRefs) {
          const e = assetRefEntryPointsMap.get(assetRef)
          if (e) {
            e.push(entryPoint.name)
          } else {
            assetRefEntryPointsMap.set(assetRef, [entryPoint.name])
          }
        }
      }

      for (const asset of assets) {
        const assetModules = asset.moduleRefs.map((ref) => moduleMap[ref]).filter(Boolean)
        const entrypoints = assetRefEntryPointsMap.get(asset.ref) || []
        assetModules.forEach((module) => {
          if (!commonModuleMap.has(module.path)) {
            commonModuleMap.set(module.path, new Map())
          }
          commonModuleMap.get(module.path)!.set(asset.name, {
            id: artifact.id,
            name: artifact.name,
            entrypoints,
          })
        })
      }
    }

    Array.from(commonModuleMap.entries()).forEach(([modulePath, artifactMap]) => {
      if (artifactMap.size === 1) {
        commonModuleMap.delete(modulePath)
      }
    })

    return Object.fromEntries(
      Array.from(commonModuleMap.entries()).map(([modulePath, artifactMap]) => [
        modulePath,
        Object.fromEntries(artifactMap.entries()),
      ]),
    )
  }

  private tapMetrics(artifact: Artifact) {
    if (artifact.status === BundleJobStatus.Failed) {
      this.metric.bundleFail(1)
    } else if (artifact.status === BundleJobStatus.Passed) {
      this.metric.bundleComplete(1)
      if (artifact.score && artifact.score <= 80) {
        this.metric.blockRelease(1, { jobType: JobType.BundleAnalyze })
      }
    }
  }

  private async updateArtifactUploadSize(artifact: Artifact, uploadSize: number) {
    await Artifact.createQueryBuilder()
      .update()
      .set({
        uploadSize: () => `upload_size + ${uploadSize}`,
      })
      .where({ id: artifact.id })
      .execute()
  }
}
