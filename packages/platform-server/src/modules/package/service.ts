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
import { Brackets, In } from 'typeorm'

import { AppVersion, InternalIdUsage, Package, PackageBundle, Project, User } from '@perfsee/platform-server/db'
import { EventEmitter } from '@perfsee/platform-server/event'
import { AnalyzeUpdateType } from '@perfsee/platform-server/event/type'
import { PaginationInput } from '@perfsee/platform-server/graphql'
import { InternalIdService } from '@perfsee/platform-server/helpers'
import { Logger } from '@perfsee/platform-server/logger'
import { Metric } from '@perfsee/platform-server/metrics'
import { ObjectStorage } from '@perfsee/platform-server/storage'
import { createDataLoader } from '@perfsee/platform-server/utils'
import { BundleJobStatus, JobType, PackageJobPayload, PackageJobUpdate } from '@perfsee/server-common'
import { Permission } from '@perfsee/shared'

import { PermissionProvider } from '../permission'
import { ProjectUsageService } from '../project-usage/service'

@Injectable()
export class PackageService implements OnApplicationBootstrap {
  loader = createDataLoader((ids: number[]) =>
    Package.findBy({
      id: In(ids),
    }),
  )

  bundleLoader = createDataLoader((ids: number[]) => PackageBundle.findBy({ id: In(ids) }))

  constructor(
    private readonly internalId: InternalIdService,
    private readonly event: EventEmitter,
    private readonly logger: Logger,
    private readonly storage: ObjectStorage,
    private readonly metric: Metric,
    private readonly projectUsage: ProjectUsageService,
    private readonly permissionProvider: PermissionProvider,
  ) {}

  onApplicationBootstrap() {
    this.event.emit('job.register_payload_getter', JobType.PackageAnalyze, this.getJobPayload.bind(this))
  }

  async create(input: Partial<Package>) {
    return Package.create<Package>(input).save()
  }

  async getPackages(projectId: number, { first, after, skip }: PaginationInput, name?: string) {
    const query = Package.createQueryBuilder('package').where('package.project_id = :projectId', { projectId })

    if (after) {
      query.andWhere('package.id < :after', { after })
    }

    if (name) {
      query.andWhere('package.name = :name', { name })
    }

    return query
      .orderBy('package.id', 'DESC')
      .skip(skip)
      .take(first ?? 10)
      .getManyAndCount()
  }

  async getAllPackages(
    user: User,
    { first, skip, after }: PaginationInput,
    query?: string,
    starOnly = false,
    permission = Permission.Read,
  ) {
    const projectQueryBuilder = Project.createQueryBuilder('project')
    // only allow to query projects that the user can see
    const allowProjectIds = await this.permissionProvider.userAllowList(user, permission)
    if (allowProjectIds.length) {
      projectQueryBuilder.andWhere(
        new Brackets((builder) => {
          if (permission === Permission.Read) {
            // read permission include public
            builder.andWhereInIds(allowProjectIds).orWhere('is_public is true')
          } else {
            builder.andWhereInIds(allowProjectIds)
          }
        }),
      )
    } else {
      if (permission === Permission.Read) {
        // read permission include public
        projectQueryBuilder.andWhere('is_public is true')
      }
    }

    const projects = await projectQueryBuilder.getMany()

    if (!projects.length) {
      return []
    }

    const queryBuilder = Package.createQueryBuilder('package').where('package.project_id in (:...ids)', {
      ids: projects.map((p) => p.id),
    })

    // only allow to query projects that the user starred
    if (starOnly) {
      // queryBuilder
      //   .innerJoin(UserStarredProject, 'star', 'star.project_id = project.id')
      //   .andWhere('user_id = :userId', { userId: user.id })
    }

    // fuzzy matching
    if (query) {
      queryBuilder
        .andWhere(
          new Brackets((subBuilder) => {
            subBuilder
              .where(`package.name like :query`)
              .orWhere(`package.description like :query`)
              .orWhere(`package.keywords like :query`)
          }),
        )
        .setParameters({ query: `%${query}%` })
    }

    // ignore records before `after`
    if (after) {
      queryBuilder.andWhere('package.id > :after', { after })
    }

    return queryBuilder.orderBy('package.id', 'ASC').skip(skip).take(first).getManyAndCount()
  }

  async deleteBundleById(projectId: number, packageId: number, id: number) {
    const bundle = await PackageBundle.findOneByOrFail({ id, packageId })
    await PackageBundle.delete(bundle.id)
    await this.projectUsage.recordStorageUsage(projectId, -bundle.uploadSize)
    await this.storage.bulkDelete([bundle.buildKey, bundle.reportKey, bundle.benchmarkKey].filter(Boolean) as string[])

    return true
  }

  async resolveRawPackageIdByIid(iid: number) {
    const pkg = await Package.findOneByOrFail({ iid })
    return pkg.id
  }

  async resolvePackageIidById(id: number) {
    const pkg = await Package.findOneByOrFail({ id })
    return pkg.iid
  }

  async getPackageById(projectId: number, iid: number) {
    return Package.findOneBy({ projectId, iid })
  }

  async getLatestPackageBundle(packageId: number) {
    return PackageBundle.createQueryBuilder('package_bundle')
      .where('package_bundle.package_id = :packageId', { packageId })
      .orderBy('package_bundle.id', 'DESC')
      .getOne()
  }

  async getPackageBundleById(packageId: number, id: number) {
    return PackageBundle.findOneBy({ packageId, id })
  }

  async getPackageBundles(
    packageId: number,
    { first, after, skip }: PaginationInput,
    branch?: string,
    hash?: string,
    isBaseline?: boolean,
  ) {
    const query = PackageBundle.createQueryBuilder('package_bundle').where('package_bundle.package_id = :packageId', {
      packageId,
    })

    if (after) {
      query.andWhere('package_bundle.id < :after', { after })
    }

    if (branch) {
      query.andWhere('package_bundle.branch = :branch', { branch })
    }

    if (isBaseline) {
      query.andWhere('package_bundle.is_baseline = true')
    }

    if (hash) {
      query.andWhere('package_bundle.hash = :hash', { hash })
    }

    return query
      .leftJoinAndMapOne('package_bundle.appversion', AppVersion, 'version', 'version.hash = package_bundle.hash')
      .orderBy('package_bundle.id', 'DESC')
      .skip(skip)
      .take(first ?? 10)
      .getManyAndCount()
  }

  async createBundle(
    project: Project,
    input: Partial<PackageBundle> & Pick<PackageBundle, 'buildKey'> & Partial<Package>,
  ) {
    let pkg = await Package.findOneBy({ name: input.name, projectId: project.id })
    if (!pkg) {
      pkg = await this.create({
        projectId: project.id,
        iid: await this.internalId.generate(project.id, InternalIdUsage.Package),
        name: input.name,
        description: input.description,
        keywords: input.keywords || null,
      })
      this.logger.log(`Package ${input.name} created.`)
    } else {
      pkg.description = input.description!
      pkg.keywords = input.keywords || null
      await pkg.save()
    }

    const bundle = await PackageBundle.create<PackageBundle>({
      ...input,
      baselineId: (await this.getLastAvailableBaseline(pkg.id, input.name!))?.id,
      packageId: pkg.id,
    }).save()

    await this.dispatchJob(pkg.projectId, bundle)
    this.event.emit(`${AnalyzeUpdateType.PackageUpdate}.${BundleJobStatus.Pending}`, { project, bundle, package: pkg })
    return { bundle, pkg }
  }

  async getLastAvailableBaseline(packageId: number, packageName: string) {
    return PackageBundle.findOne({
      where: {
        packageId,
        isBaseline: true,
        status: BundleJobStatus.Passed,
        name: packageName,
      },
      order: { id: 'DESC' },
    })
  }

  async dispatchJob(projectId: number, bundle: PackageBundle) {
    if (bundle.status !== BundleJobStatus.Pending) {
      bundle.status = BundleJobStatus.Pending
      await bundle.save()
    }

    await this.event.emitAsync('job.create', {
      type: JobType.PackageAnalyze,
      payload: { entityId: bundle.id, projectId, packageId: bundle.packageId },
    })
  }

  async handleJobUpdated(update: PackageJobUpdate) {
    this.logger.log(`receive packaget update [id=${update.packageBundleId}]`)
    const bundle = await this.bundleLoader.load(update.packageBundleId)

    if (!bundle) {
      throw new NotFoundException(`package bundle with id ${update.packageBundleId} not found`)
    }

    bundle.status = update.status
    if (update.status === BundleJobStatus.Passed) {
      bundle.reportKey = update.reportKey!
      bundle.benchmarkKey = update.benchmarkKey || null
      bundle.duration = update.duration!
      bundle.size = update.size
      bundle.hasSideEffects = !!update.hasSideEffects
      bundle.hasJSModule = !!update.hasJSModule
      bundle.hasJSNext = !!update.hasJSNext
      bundle.isModuleType = !!update.isModuleType
    } else if (update.status === BundleJobStatus.Failed) {
      bundle.failedReason = update.failedReason!
    }
    await bundle.save()

    const pkg = await Package.findOneByOrFail({ id: bundle.packageId })
    const project = await Project.findOneByOrFail({ id: pkg.projectId })
    this.tapMetrics(bundle)

    this.event.emit(`${AnalyzeUpdateType.PackageUpdate}.${update.status}`, {
      project,
      package: pkg,
      bundle,
      packageJobResult: update,
    })
  }

  async handleJobFailed(packageBundleId: number, reason: string) {
    const packageBundle = await this.bundleLoader.load(packageBundleId)
    if (!packageBundle) {
      throw new NotFoundException(`artifact with id ${packageBundleId} not found`)
    }

    packageBundle.status = BundleJobStatus.Failed
    packageBundle.failedReason = reason

    await packageBundle.save({ reload: false })
    const pkg = await Package.findOneByOrFail({ id: packageBundle.packageId })
    const project = await Project.findOneByOrFail({ id: pkg.projectId })
    this.event.emit(`${AnalyzeUpdateType.PackageUpdate}.${BundleJobStatus.Failed}`, {
      project,
      package: pkg,
      bundle: packageBundle,
      packageJobResult: {
        packageBundleId: packageBundle.id,
        status: BundleJobStatus.Failed,
        failedReason: reason,
        duration: 0,
      },
    })
  }

  async handleJobUpload(packageBundleId: number, uploadSize: number) {
    const report = await PackageBundle.findOneOrFail({
      where: { id: packageBundleId },
      relations: ['package'],
    })

    await this.projectUsage.recordStorageUsage(report.package.projectId, uploadSize)
    await this.updateArtifactUploadSize(report, uploadSize)
  }

  async getJobPayload(packageBundleId: number): Promise<PackageJobPayload> {
    const bundle = await this.bundleLoader.load(packageBundleId)
    if (!bundle) {
      throw new NotFoundException(`package bundle with id ${packageBundleId} not found`)
    }

    return {
      packageBundleId,
      buildKey: bundle.buildKey,
    }
  }

  async getHistory(packageId: number, to: Date, limit = 10, branch?: string) {
    const query = PackageBundle.createQueryBuilder('package_bundle')
      .where('package_bundle.package_id = :packageId', { packageId })
      .andWhere('package_bundle.created_at <= :to', { to })

    if (branch) {
      query.andWhere('package_bundle.branch = :branch', { branch })
    }

    return query.orderBy('created_at', 'DESC').take(limit).getMany()
  }

  private tapMetrics(bundle: PackageBundle) {
    if (bundle.status === BundleJobStatus.Failed) {
      this.metric.packageFaile(1)
    } else if (bundle.status === BundleJobStatus.Passed) {
      this.metric.packageComplete(1)
    }
  }

  private async updateArtifactUploadSize(bundle: PackageBundle, uploadSize: number) {
    await PackageBundle.createQueryBuilder()
      .update()
      .set({
        uploadSize: () => `upload_size + ${uploadSize}`,
      })
      .where({ id: bundle.id })
      .execute()
  }
}
