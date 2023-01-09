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

import {
  Resolver,
  Args,
  Int,
  Parent,
  ResolveField,
  Mutation,
  GraphQLISODateTime,
  ObjectType,
  ID,
} from '@nestjs/graphql'

import { Artifact, Project, ArtifactEntrypoint, AppVersion } from '@perfsee/platform-server/db'
import { UserError } from '@perfsee/platform-server/error'
import { PaginationInput, PaginatedType, paginate, Paginated } from '@perfsee/platform-server/graphql'

import { PermissionGuard, Permission } from '../permission'
import { ProjectService } from '../project/service'

import { ArtifactService } from './service'

@ObjectType()
class PaginatedArtifacts extends Paginated(Artifact) {}

@Resolver(() => Project)
export class ProjectArtifactResolver {
  constructor(private readonly service: ArtifactService) {}

  @ResolveField(() => Artifact, { name: 'artifact', description: 'get artifact by id' })
  artifact(@Parent() project: Project, @Args({ name: 'id', type: () => Int, description: 'artifact id' }) id: number) {
    return this.service.getArtifactByIid(project.id, id)
  }

  @ResolveField(() => [String])
  artifactNames(@Parent() project: Project) {
    return this.service.getArtifactNames(project.id)
  }

  @ResolveField(() => Artifact, {
    name: 'artifactByCommit',
    nullable: true,
    description: 'get artifacts by git commit hash',
    deprecationReason: 'use artifacts(hash: $hash)',
  })
  artifactByCommit(
    @Parent() project: Project,
    @Args({ name: 'hash', type: () => String, description: 'git commit hash to match' }) hash: string,
  ) {
    return this.service.getArtifactByCommit(project.id, hash)
  }

  @ResolveField(() => PaginatedArtifacts, { description: 'paginated artifact of given project' })
  async artifacts(
    @Parent() project: Project,
    @Args({
      name: 'pagination',
      type: () => PaginationInput,
      nullable: true,
      defaultValue: { first: 10 },
    })
    paginationOption: PaginationInput,
    @Args({ name: 'branch', type: () => String, nullable: true, description: 'git branch filter' }) branch?: string,
    @Args({ name: 'name', type: () => String, nullable: true, description: 'name filter' }) name?: string,
    @Args({ name: 'hash', type: () => String, nullable: true, description: 'hash filter' }) hash?: string,
  ): Promise<PaginatedType<Artifact>> {
    const [artifacts, totalCount] = await this.service.getArtifacts(project.id, paginationOption, branch, name, hash)

    return paginate(artifacts, 'id', paginationOption, totalCount)
  }

  @ResolveField(() => [ArtifactEntrypoint], { name: 'artifactHistory', description: 'all artifact historical data' })
  asyncArtifactHistoryData(
    @Parent() project: Project,
    @Args({ name: 'from', type: () => GraphQLISODateTime, nullable: true }) from: Date | undefined,
    @Args({ name: 'to', type: () => GraphQLISODateTime, nullable: true }) to: Date | undefined,
    @Args({ name: 'length', type: () => Int, nullable: true, description: 'max length of records returned' })
    length: number | undefined,
    @Args({
      name: 'branch',
      type: () => String,
      nullable: true,
      defaultValue: 'master',
      description: 'branch filter',
    })
    branch: string,
    @Args({
      name: 'name',
      type: () => String,
      nullable: true,
      description: 'name filter',
    })
    name?: string,
  ) {
    return this.service.getHistory(project.id, branch, name, from, to, length)
  }

  @ResolveField(() => Int, { name: 'artifactCount' })
  artifactCount(@Parent() project: Project) {
    return this.service.getArtifactCount(project.id)
  }
}

@Resolver(() => Artifact)
export class ArtifactResolver {
  constructor(private readonly service: ArtifactService, private readonly projectService: ProjectService) {}

  @ResolveField(() => Artifact, {
    name: 'baseline',
    nullable: true,
    description: 'baseline artifact',
  })
  baseline(@Parent() artifact: Artifact) {
    if (!artifact.baselineId) {
      return null
    }
    return this.service.loader.load(artifact.baselineId)
  }

  @ResolveField(() => [ArtifactEntrypoint], {
    nullable: true,
    description: 'all entry points of given artifact',
  })
  entrypoints(@Parent() artifact: Artifact) {
    return this.service.getArtifactEntrypoints(artifact.id)
  }

  @PermissionGuard(Permission.Read, 'projectId')
  @Mutation(() => Boolean, { name: 'dispatchArtifactJob', description: 'trigger artifact bundle analyze job' })
  async dispatchArtifactJob(
    @Args({ name: 'projectId', type: () => ID }) projectId: string,
    @Args({ name: 'id', type: () => Int, description: 'artifact id' }) iid: number,
  ) {
    const projectRawId = await this.projectService.resolveRawProjectIdBySlug(projectId)
    const artifact = await this.service.getArtifactByIid(projectRawId, iid)

    if (!artifact) {
      throw new UserError(`Artifact with id ${iid} not found.`)
    }

    await this.service.dispatchJob(artifact).catch(() => {
      throw new UserError(`Failed to create new job for artifact ${artifact.id}`)
    })

    return true
  }

  @PermissionGuard(Permission.Admin, 'projectId')
  @Mutation(() => Boolean)
  async deleteArtifact(
    @Args({ name: 'projectId', type: () => ID }) projectId: string,
    @Args({ name: 'artifactId', type: () => Int }) artifactId: number,
  ) {
    const rawId = await this.projectService.resolveRawProjectIdBySlug(projectId)

    return this.service.deleteArtifactById(rawId, artifactId)
  }

  @ResolveField(() => AppVersion, {
    nullable: true,
  })
  async version(@Parent() artifact: Artifact) {
    return artifact.version ?? (await AppVersion.findOneBy({ projectId: artifact.projectId, hash: artifact.hash }))
  }
}

@Resolver(() => ArtifactEntrypoint)
export class ArtifactEntrypointResolver {
  constructor(private readonly artifact: ArtifactService) {}

  @ResolveField(() => Int, { nullable: true })
  async artifactId(@Parent() entrypoint: ArtifactEntrypoint) {
    const artifact = await this.artifact.loader.load(entrypoint.artifactId)
    return artifact?.iid ?? null
  }
}
