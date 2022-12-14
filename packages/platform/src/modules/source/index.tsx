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

import { GitlabOutlined } from '@ant-design/icons'
import {
  IColumn,
  SelectionMode,
  Stack,
  TooltipHost,
  IconButton,
  IIconProps,
  NeutralColors,
  DefaultButton,
  Shimmer,
} from '@fluentui/react'
import { useModule, useModuleState } from '@sigi/react'
import { memo, useCallback, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'

import {
  TooltipWithEllipsis,
  Pagination,
  Table,
  useTeachingSerials,
  ForeignLink,
  useQueryString,
  ContentCard,
  Empty,
  useWideScreen,
} from '@perfsee/components'
import { ConstantColors } from '@perfsee/dls'
import { formatTime, stopPropagation } from '@perfsee/platform/common'
import { getCommitLink } from '@perfsee/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { CommitHashSelector } from '../components'
import { FlamechartPlaceholder } from '../flamechart'
import { ProjectModule, ProjectInfo, useProjectRouteGenerator } from '../shared'

import { FlamechartView } from './flamechart'
import { SourceIssue, SourceIssuesModule } from './source.module'
import { PanelContainer, FlamechartHeader, VscodeIcon } from './style'
import vscodeScreenshot from './vscode.png'

const flamechartIconProps: IIconProps = {
  iconName: 'Calories',
  styles: {
    root: {
      color: ConstantColors.gitlab.CGRed,
    },
  },
}

interface OperationColumnProps {
  item: SourceIssue
  project: ProjectInfo
  onClick: (sourceIssue: SourceIssue) => void
}

const OperationColumn = ({ item, onClick, project }: OperationColumnProps) => {
  const handleOnClick = useCallback(() => {
    onClick(item)
  }, [item, onClick])

  return (
    <Stack horizontal={true} verticalAlign="center">
      <TooltipHost key="flame" content="Show in Flame Chart">
        <IconButton iconProps={flamechartIconProps} onClick={handleOnClick} />
      </TooltipHost>
      <TooltipHost key="gitlab" content="Goto Commit Detail">
        <IconButton href={getCommitLink(project!, item.hash)} target="_blank" rel="noopenner">
          <GitlabOutlined style={{ fontSize: 16, color: ConstantColors.gitlab.Crayola }} />
        </IconButton>
      </TooltipHost>
    </Stack>
  )
}

interface IIssuesListProps {
  issues: SourceIssue[]
  selectedIssueIndex: number
  totalCount: number
  loading: boolean
  pageNum: number
  pageSize: number
  onOpenFlamechart: (sourceIssue: SourceIssue) => void
  onPageChange: (pageNum: number, pageSize: number) => void
}

const IssuesList: React.FunctionComponent<IIssuesListProps> = memo(
  ({ pageNum, pageSize, issues, loading, totalCount, onOpenFlamechart, onPageChange, selectedIssueIndex }) => {
    const { project } = useModuleState(ProjectModule)
    const generateProjectRoute = useProjectRouteGenerator()

    const columns: IColumn[] = useMemo(
      () => [
        {
          key: 'report',
          name: 'Report',
          minWidth: 80,
          maxWidth: 80,
          onRender: (item: SourceIssue) => {
            return (
              <TooltipWithEllipsis content={item.snapshotReport.page.name}>
                <Link
                  onClick={stopPropagation}
                  to={generateProjectRoute(pathFactory.project.lab.report, {
                    reportId: item.snapshotReport.id,
                    tabName: 'overview',
                  })}
                >
                  {item.snapshotReport.page.name}
                </Link>
              </TooltipWithEllipsis>
            )
          },
        },
        {
          key: 'function',
          name: 'Function',
          minWidth: 100,
          maxWidth: 100,
          onRender: (item: SourceIssue) => {
            return <TooltipWithEllipsis content={item.frameKey.substring(0, item.frameKey.indexOf(':'))} />
          },
        },
        {
          key: 'file',
          name: 'File',
          minWidth: 200,
          onRender: (item: SourceIssue) => {
            return <TooltipWithEllipsis content={item.frameKey.substring(item.frameKey.indexOf(':') + 1)} />
          },
        },
        {
          key: 'time',
          name: 'Time',
          minWidth: 70,
          maxWidth: 70,
          onRender: (item: SourceIssue) => {
            if (item.info?.unit !== 'us') return 'Unknown time format'
            const formatted = formatTime(item.info?.value / 1000)

            return formatted.value + formatted.unit
          },
        },
        {
          key: 'operations',
          name: '',
          minWidth: 100,
          maxWidth: 100,
          onRender: (item: SourceIssue) => {
            return <OperationColumn project={project!} item={item} onClick={onOpenFlamechart} />
          },
        },
      ],
      [generateProjectRoute, onOpenFlamechart, project],
    )

    return (
      <Stack tokens={{ childrenGap: 16 }}>
        <Table
          items={issues}
          enableShimmer={loading}
          columns={columns}
          selectionMode={SelectionMode.none}
          onRowClick={onOpenFlamechart}
          shimmerLines={pageSize}
          detailsListStyles={{
            headerWrapper: { '> div[role=row]': { paddingTop: 0 } },
            root: {
              cursor: 'pointer',
              [`& .ms-DetailsRow[data-item-index="${selectedIssueIndex}"]`]: {
                background: NeutralColors.gray40,
              },
            },
          }}
        />
        <Stack.Item align="center">
          <Pagination
            total={totalCount}
            page={pageNum}
            pageSize={pageSize}
            onChange={onPageChange}
            hideOnSinglePage={true}
          />
        </Stack.Item>
      </Stack>
    )
  },
)

const teachingSerials = [
  {
    headline: 'Issues List',
    body: 'This is a list of all the performance issues in your application.',
  },
  {
    headline: 'Flamechart',
    body: 'Try dragging and scrolling to navigate the flamechart.',
  },
  {
    headline: 'Vscode extension',
    body: 'Try dragging and scrolling to navigate the flamechart.',
    illustrationImage: { src: vscodeScreenshot, alt: 'Example placeholder image' },
  },
]

type SourceQueryStringType = {
  hash: string
  issueId: number
  reportId: number
  page: number
  pageSize: number
}

export const Source = () => {
  useWideScreen()
  const [state, dispatcher] = useModule(SourceIssuesModule)
  const {
    bubbles: [TeachingStep1, TeachingStep2, TeachingStep3],
    skipStep,
  } = useTeachingSerials('source', teachingSerials, {
    visible: !state.loadingIssue && !state.loadingHashes,
    delay: 500,
  })

  const [queryStrings, updateQueryString] = useQueryString<SourceQueryStringType>()
  const { page = 1, pageSize = 14, hash = '', issueId, reportId } = queryStrings

  const selectedIssueIndex = useMemo(() => {
    if (state.loadingIssue || !issueId || !reportId) {
      return -1
    }

    return state.issues.findIndex((issue) => issue.snapshotReport.id === reportId && issue.id === issueId)
  }, [issueId, reportId, state.issues, state.loadingIssue])

  const onPageChange = useCallback(
    (page: number, pageSize: number) => {
      updateQueryString({
        page,
        pageSize,
      })
    },
    [updateQueryString],
  )

  const onCommitChange = useCallback(
    (hash: string) => {
      updateQueryString({
        hash,
        page: 1,
        issueId: undefined,
        reportId: undefined,
      })
    },
    [updateQueryString],
  )

  const handleOpenFlamechart = useCallback(
    (sourceIssue: SourceIssue) => {
      skipStep(0)
      updateQueryString(
        {
          issueId: sourceIssue.id,
          reportId: sourceIssue.snapshotReport.id,
        },
        true,
        true,
      )
    },
    [skipStep, updateQueryString],
  )

  useEffect(() => {
    dispatcher.getIssueCommits()
    return dispatcher.reset
  }, [dispatcher])

  useEffect(() => {
    if (hash) {
      dispatcher.getIssues({
        pageNum: Number(page),
        pageSize: Number(pageSize),
        hash,
      })
    }
  }, [dispatcher, page, pageSize, hash])

  // auto select latest hash
  useEffect(() => {
    if (state.hashes.length && (!hash || !state.hashes.includes(hash))) {
      updateQueryString(
        {
          hash: state.hashes[0],
        },
        true,
      )
    }
  }, [state.hashes, updateQueryString, hash])

  // auto select first issue in list
  useEffect(() => {
    if (state.issues.length && typeof issueId !== 'number') {
      updateQueryString(
        {
          issueId: state.issues[0].id,
          reportId: state.issues[0].snapshotReport.id,
        },
        true,
        true,
      )
    }
  }, [state.issues, updateQueryString, issueId])

  if (!state.hashes.length && !state.loadingHashes) {
    return (
      <ContentCard>
        <Empty title="No source issue" />
      </ContentCard>
    )
  }

  return (
    <ContentCard>
      <Stack horizontal horizontalAlign="space-between">
        <Shimmer isDataLoaded={!state.loadingHashes}>
          <CommitHashSelector items={state.hashes} value={hash} onChange={onCommitChange} />
        </Shimmer>
        <ForeignLink href="https://marketplace.visualstudio.com/items?itemName=perfsee.perfsee-vscode">
          <TeachingStep3>
            <DefaultButton>
              <VscodeIcon />
              Install Vscode Extension
            </DefaultButton>
          </TeachingStep3>
        </ForeignLink>
      </Stack>
      <Stack horizontal>
        <PanelContainer>
          <TeachingStep1>
            <IssuesList
              selectedIssueIndex={selectedIssueIndex}
              issues={state.issues}
              totalCount={state.totalCount}
              loading={state.loadingIssue}
              pageNum={page}
              pageSize={pageSize}
              onPageChange={onPageChange}
              onOpenFlamechart={handleOpenFlamechart}
            />
          </TeachingStep1>
        </PanelContainer>

        <PanelContainer>
          <TeachingStep2>
            <FlamechartHeader>Flamechart</FlamechartHeader>
          </TeachingStep2>
          {selectedIssueIndex > -1 ? (
            <FlamechartView issue={state.issues[selectedIssueIndex]} />
          ) : (
            <FlamechartPlaceholder>Select on left</FlamechartPlaceholder>
          )}
        </PanelContainer>
      </Stack>
    </ContentCard>
  )
}
