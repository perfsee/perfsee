import { BranchesOutlined, CalendarOutlined, NodeIndexOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { useTheme } from '@emotion/react'
import {
  HoverCard,
  HoverCardType,
  IHoverCardProps,
  PrimaryButton,
  Spinner,
  SpinnerSize,
  Stack,
  Text,
} from '@fluentui/react'
import { useModule } from '@sigi/react'
import dayJs from 'dayjs'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import { Empty, ScoreBlock, Tag } from '@perfsee/components'
import { SnapshotDetailType, SnapshotUserFlowDetailType } from '@perfsee/lab-report/snapshot-type'
import { Commit } from '@perfsee/platform/modules/components/commit'
import { useProjectRouteGenerator } from '@perfsee/platform/modules/shared'
import { JobType, SourceStatus } from '@perfsee/schema'
import { PrettyBytes, SourceAnalyzeStatistics } from '@perfsee/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { SourceAnalyzeStatisticsModule } from './module'
import { SourceStatusTag } from './status-tag'
import {
  SourceZoneContainer,
  SourceZoneSubtitle,
  SourceStateToolbar,
  SourceScoreList,
  SourceZoneTitle,
  ArtifactInfoContainer,
  ArtifactHeader,
  ArtifactHeaderContainer,
  ArtifactZoneContainer,
  ExpandingCardWrapper,
} from './style'

const smallGapToken = { childrenGap: 8 }

const HelpCard = (title: React.ReactNode, details?: React.ReactNode) =>
  ({
    type: details ? HoverCardType.expanding : HoverCardType.plain,
    cardOpenDelay: 300,
    expandedCardOpenDelay: 300,
    plainCardProps: {
      onRenderPlainCard: () => <ExpandingCardWrapper>{title}</ExpandingCardWrapper>,
    },
    expandingCardProps: {
      onRenderCompactCard: () => <ExpandingCardWrapper>{title}</ExpandingCardWrapper>,
      onRenderExpandedCard: () => <ExpandingCardWrapper>{details}</ExpandingCardWrapper>,
      styles: {
        compactCard: {
          height: 'auto',
        },
        expandedCardScroll: {
          height: 'calc(100% - 20px)',
          overflow: 'auto',
        },
      },
    },
    styles: {
      root: {
        display: 'inline-block',
      },
    },
  } as IHoverCardProps)

const AssociatedArtifactsHelp = HelpCard(
  <>
    <h2>Associated Artifacts</h2>
  </>,
  <>
    The source analysis can analyze which version of bundle artifacts are running on the page from the lab analysis
    data, as the following list shows the entrypoints of each bundle artifacts and the script file size on the page.
  </>,
)

const JavascriptSizeHelp = HelpCard(
  <>The Javascript Size counts the total size of the javascript files for this artifact in the page.</>,
)

export const SourceStatisticsContent = ({
  snapshot,
}: {
  snapshot: SnapshotDetailType | SnapshotUserFlowDetailType
}) => {
  const theme = useTheme()
  const report = 'report' in snapshot ? snapshot.report : null
  const [{ data: sourceStatistics, loading }, dispatcher] = useModule(SourceAnalyzeStatisticsModule)

  useEffect(() => {
    if (!report?.sourceAnalyzeStatisticsLink) {
      return
    }
    dispatcher.fetchSourceCoverageResult(report.sourceAnalyzeStatisticsLink)

    return dispatcher.reset
  }, [dispatcher, report])

  const status = report?.sourceStatus

  const generateProjectRoute = useProjectRouteGenerator()

  if (!status) {
    return <Empty withIcon={true} styles={{ root: { margin: '10px' } }} title="No report" />
  }

  if (loading || !sourceStatistics) {
    return <Spinner size={SpinnerSize.large} />
  }

  const jobLogLink = generateProjectRoute(pathFactory.project.jobTrace, {
    type: JobType.SourceAnalyze,
    entityId: report.id,
  })

  return (
    <Stack tokens={{ childrenGap: 16 }}>
      <SourceZoneContainer>
        <SourceStateToolbar>
          <Stack horizontal tokens={smallGapToken} verticalAlign="center">
            <Text variant="large">
              <b>Source analyze</b>
            </Text>
            <Link to={jobLogLink}>
              <SourceStatusTag status={status} />
            </Link>
          </Stack>
        </SourceStateToolbar>
        <SourceZoneSubtitle variant="medium">
          {status === SourceStatus.Completed ? (
            <>
              Execute {sourceStatistics.scriptCount ?? 0} javascript files, use {sourceStatistics.sourceMapCount ?? 0}{' '}
              source map, from {sourceStatistics.artifacts?.length ?? 0} artifacts,{' '}
              {sourceStatistics.artifacts?.reduce((p, a) => a.entryPoints.length + p, 0) ?? 0} entrypoints.
            </>
          ) : status === SourceStatus.Failed ? (
            <>
              Source analyze failed, click <Link to={jobLogLink}>here</Link> to get the run log.
            </>
          ) : (
            <>
              Source analyze is running, which will take a few minutes, and the flamechart and js coverage data will be
              ready when it is done.
            </>
          )}
        </SourceZoneSubtitle>
        {status === SourceStatus.Completed && (
          <SourceScoreList>
            <ScoreBlock
              title="Total Execution Time"
              value={sourceStatistics.totalExecutionTimeMs?.toFixed(1)}
              unit="ms"
              color={theme.colors.success}
            />
            <ScoreBlock
              title="Execute Third Party"
              value={sourceStatistics.thirdPartyScriptTimeUsingMs?.toFixed(1)}
              unit="ms"
              color={theme.colors.success}
            />
            <ScoreBlock title="Total Javascript Files" value={sourceStatistics.scriptCount} unit="files" />
            <ScoreBlock title="Restore Sourcemap" value={sourceStatistics.sourceMapCount} unit="files" />
          </SourceScoreList>
        )}
      </SourceZoneContainer>
      {status === SourceStatus.Completed && (
        <>
          <SourceZoneTitle>
            Artifacts
            <HoverCard {...AssociatedArtifactsHelp}>
              <QuestionCircleOutlined size={12} style={{ cursor: 'pointer' }} />
            </HoverCard>
          </SourceZoneTitle>
          {sourceStatistics.artifacts?.map((artifact, i) => (
            <SourceArtifact artifact={artifact} key={i} />
          ))}
        </>
      )}
    </Stack>
  )
}

const SourceArtifact = ({ artifact }: { artifact: NonNullable<SourceAnalyzeStatistics['artifacts']>[number] }) => {
  const sizeBytes = PrettyBytes.create(artifact.size.raw, { signed: true })
  const initialSizeBytes = PrettyBytes.create(artifact.initialSize.raw, { signed: true })
  const generateProjectRoute = useProjectRouteGenerator()
  return (
    <ArtifactZoneContainer>
      <Stack horizontal verticalAlign="center">
        <ArtifactHeaderContainer>
          <ArtifactHeader>
            <Text variant="medium">
              <b>#{artifact.id}</b>
            </Text>
            {artifact.entryPoints.length > 0 && <Tag type="default">entrypoint: {artifact.entryPoints.join(',')}</Tag>}
          </ArtifactHeader>
          <ArtifactInfoContainer>
            <Stack.Item shrink={0}>
              <CalendarOutlined />
              <span>{dayJs(artifact.createdAt).fromNow()}</span>
            </Stack.Item>
            <Stack.Item shrink={0}>
              <NodeIndexOutlined />
              <Commit hash={artifact.hash} />
            </Stack.Item>
            {artifact.branch && (
              <Stack.Item shrink={1}>
                <BranchesOutlined />
                <span>{artifact.branch}</span>
              </Stack.Item>
            )}
          </ArtifactInfoContainer>
        </ArtifactHeaderContainer>
        <ScoreBlock
          title={
            <Stack horizontal tokens={smallGapToken}>
              <span>Javascript Size</span>
              <HoverCard {...JavascriptSizeHelp}>
                <QuestionCircleOutlined size={12} style={{ cursor: 'pointer' }} />
              </HoverCard>
            </Stack>
          }
          value={sizeBytes.value}
          unit={sizeBytes.unit}
          small
        />
        <ScoreBlock title="Initial Javascript Size" value={initialSizeBytes.value} unit={initialSizeBytes.unit} small />
      </Stack>
      <Link
        to={generateProjectRoute(pathFactory.project.bundle.detail, {
          bundleId: artifact.id,
        })}
      >
        <PrimaryButton iconProps={{ iconName: 'bundle' }}>Bundle</PrimaryButton>
      </Link>
    </ArtifactZoneContainer>
  )
}
