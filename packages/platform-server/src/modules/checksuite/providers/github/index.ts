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
import { escape } from 'lodash'

import { GithubCheckRunsAssociation, GithubPullRequestsAssociation } from '@perfsee/platform-server/db'
import { UrlService } from '@perfsee/platform-server/helpers'
import { pathFactory } from '@perfsee/shared/routes'

import { GithubCheckRunOutput, GithubCheckRunParameters, GithubService } from '../../../github'
import { CheckAction, CheckConclusion, CheckStatus, CheckSuiteProvider, CheckType } from '../../types'

import { renderBundleOutput } from './bundle'
import { renderLabOutput } from './lab'

@Injectable()
export class GithubCheckSuiteProvider implements CheckSuiteProvider {
  constructor(private readonly github: GithubService, private readonly url: UrlService) {}

  async createOrUpdateCheck(action: CheckAction) {
    if (!this.github.available) {
      return
    }
    const checkName = action.type === CheckType.Bundle ? `${action.type} - ${action.artifact.name}` : action.type
    const checkId = `${action.project.id}-${action.commitHash}-${checkName}`

    const installation = await this.github.getInstallationByRepository(action.project.namespace, action.project.name)
    const accessToken = await this.github.getInstallationAccessToken(installation.id)

    const params: GithubCheckRunParameters = {
      name: `${action.project.slug} - ${checkName}`,
      external_id: action.runId.toString(),
      status: this.convertStatus(action.status),
      conclusion: this.convertConclusion(action.conclusion),
      started_at: action.startedAt?.toISOString(),
      completed_at: action.completedAt?.toISOString(),
      details_url: action.detailsUrl,
      output: this.renderCheckOutput(action),
    }

    // check if created
    const existedCheckRun = await GithubCheckRunsAssociation.findOneBy({ checkId: checkId })
    let pullRequests
    if (existedCheckRun) {
      // update check run if exists
      const updated = await this.github.updateCheckRun(
        existedCheckRun.githubCheckRunId,
        action.project.namespace,
        action.project.name,
        accessToken,
        params,
      )
      pullRequests = updated.pull_requests.map((pr) => ({ id: pr.id, number: pr.number }))
    } else {
      const newCheckRun = await this.github.createCheckRun(
        action.commitHash,
        action.project.namespace,
        action.project.name,
        accessToken,
        params,
      )
      pullRequests = newCheckRun.pull_requests.map((pr) => ({ id: pr.id, number: pr.number }))
      await GithubCheckRunsAssociation.create({
        checkId: checkId,
        githubCheckRunId: newCheckRun.id,
      }).save()
    }

    if (action.status === CheckStatus.completed && pullRequests.length > 0) {
      const commentBody = params.output?.summary ?? ''
      for (const pr of pullRequests) {
        // TODO: need a lock here to prevent duplicate comment
        const existedCommentId = (await GithubPullRequestsAssociation.findOneBy({ githubPullRequestId: pr.id }))
          ?.githubPullRequestCommentId
        if (existedCommentId) {
          // update comment if exists
          const existedComment = await this.github.getIssueComment(
            action.project.namespace,
            action.project.name,
            existedCommentId,
            accessToken,
          )
          await this.github.updateIssueComment(
            action.project.namespace,
            action.project.name,
            existedCommentId,
            mergeComment(existedComment.body, commentBody, checkName, action.project.slug),
            accessToken,
          )
        } else {
          const comment = await this.github.createIssueComment(
            action.project.namespace,
            action.project.name,
            pr.number,
            mergeComment('', commentBody, checkName, action.project.slug),
            accessToken,
          )
          await GithubPullRequestsAssociation.insert({
            githubPullRequestId: pr.id,
            githubPullRequestCommentId: comment.id,
          })
        }
      }
    }
  }

  private renderCheckOutput(action: CheckAction): GithubCheckRunOutput | undefined {
    const projectParams = {
      projectId: action.project.slug,
    }

    if (action.status === CheckStatus.completed) {
      if (action.type === CheckType.Bundle) {
        return renderBundleOutput(
          action,
          this.url.projectUrl(pathFactory.project.bundle.detail, {
            ...projectParams,
            bundleId: action.artifact.iid,
          }),
        )
      } else if (action.type === CheckType.Lab) {
        return renderLabOutput(
          action,
          this.url.projectUrl(pathFactory.project.lab.report, {
            ...projectParams,
            reportId: action.reports[0].iid,
          }),
        )
      }
    }

    return undefined
  }

  private convertStatus(status?: CheckStatus): GithubCheckRunParameters['status'] {
    switch (status) {
      case CheckStatus.queued:
        return 'queued'
      case CheckStatus.inProgress:
        return 'in_progress'
      case CheckStatus.completed:
        return 'completed'
      default:
        return undefined
    }
  }

  private convertConclusion(conclusion?: CheckConclusion): GithubCheckRunParameters['conclusion'] {
    switch (conclusion) {
      case CheckConclusion.Success:
        return 'success'
      case CheckConclusion.Failure:
        return 'failure'
      case CheckConclusion.Cancelled:
        return 'cancelled'
      default:
        return undefined
    }
  }
}

function mergeComment(oldContent: string, newContent: string, type: string, sectionName: string): string {
  const cleanup = (md: string) => {
    return md.replace(/(\r\n|\n){3,}/g, '\r\n\r\n')
  }
  const sectionStart = `<!-- SECTION-START:${escape(sectionName)} -->`
  const sectionEnd = `<!-- SECTION-END:${escape(sectionName)} -->`
  const start = `<!-- START:${type} -->`
  const end = `<!-- END:${type} -->`

  const projectStartIndex = oldContent.indexOf(sectionStart)
  const projectEndIndex = oldContent.indexOf(sectionEnd, projectStartIndex)
  const startIndex = oldContent.indexOf(start, projectStartIndex)
  const endIndex = oldContent.indexOf(end, startIndex)

  if (projectStartIndex === -1 || projectEndIndex === -1) {
    return cleanup(
      [oldContent, sectionStart, `# ${escape(sectionName)}`, start, newContent, end, sectionEnd].join('\r\n'),
    )
  }

  if (startIndex === -1 || endIndex === -1 || startIndex < projectStartIndex || endIndex > projectEndIndex) {
    return cleanup(
      [oldContent.substring(0, projectEndIndex), start, newContent, end, oldContent.substring(projectEndIndex)].join(
        '\r\n',
      ),
    )
  }

  return cleanup(
    [oldContent.substring(0, startIndex), start, newContent, end, oldContent.substring(endIndex + end.length)].join(
      '\r\n',
    ),
  )
}
