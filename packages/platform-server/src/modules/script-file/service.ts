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

import { Injectable } from '@nestjs/common'
import { chunk } from 'lodash'

import { ScriptFile } from '@perfsee/platform-server/db'

export interface SourceMapTrackParams {
  artifactId: number
  artifactName: string
  scripts: {
    filePath: string
  }[]
}

export interface FindArtifactsByScriptResult {
  artifacts: { id: number; name: string }[]
  scripts: { url: string; hash: string; artifact?: { id: number; filePath: string } }[]
}

export type SourceMapSearchResult = { artifactId: number; artifactName: string; filePath: string }[]

/**
 * This service uses database to track all javascript files uploaded by the project,
 * and provides a method to reverse lookup from javascript files to artifactId.
 */
@Injectable()
export class ScriptFileService {
  async recordScriptFile(projectId: number, artifactId: number, artifactName: string, scripts: { fileName: string }[]) {
    const BATCH_SIZE = 30

    for (const batch of chunk(scripts, BATCH_SIZE)) {
      await ScriptFile.createQueryBuilder()
        .insert()
        .into(ScriptFile)
        .values(
          batch.map((script) => ({
            projectId,
            fileName: script.fileName,
            fromArtifactId: artifactId,
            artifactName,
            createdAt: new Date(),
          })),
        )
        .orUpdate(['from_artifact_id', 'created_at'], ['project_id', 'file_name', 'artifact_name'])
        .execute()
    }
  }

  async findArtifactsByScript(
    projectId: number,
    scripts: { fileName: string }[],
  ): Promise<{ id: number; name: string }[]> {
    const BATCH_SIZE = 50

    const artifacts: { id: number; name: string }[] = []
    for (const batch of chunk(scripts, BATCH_SIZE)) {
      const newArtifacts = await ScriptFile.createQueryBuilder()
        .select(['MAX(from_artifact_id) as id', 'artifact_name as name'])
        .where('project_id = :projectId', { projectId })
        .andWhere('file_name in (:...fileNames)', { fileNames: batch.map((s) => s.fileName) })
        .groupBy('name')
        .getRawMany<{ id: number; name: string }>()
      for (const newArtifact of newArtifacts) {
        const prev = artifacts.find((a) => a.name === newArtifact.name)
        if (prev) {
          prev.id = Math.max(prev.id, newArtifact.id)
        } else {
          artifacts.push(newArtifact)
        }
      }
    }

    return artifacts
  }
}
