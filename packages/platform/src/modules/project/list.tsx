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

import { css } from '@emotion/react'
import {
  Stack,
  IStackTokens,
  ImageFit,
  Text,
  Pivot,
  PivotItem,
  Spinner,
  SearchBox,
  DirectionalHint,
  List,
  PrimaryButton,
} from '@fluentui/react'
import { useModule } from '@sigi/react'
import { debounce } from 'lodash'
import { useEffect, useCallback, useState } from 'react'
import { Link, useHistory } from 'react-router-dom'

import {
  Pagination,
  BodyContainer,
  BodyPadding,
  Empty,
  TeachingBubbleHost,
  useQueryString,
  GitlabIcon,
  GithubIcon,
} from '@perfsee/components'
import { NeutralColors, SharedColors } from '@perfsee/dls'
import { GitHost } from '@perfsee/schema'
import { pathFactory, staticPath } from '@perfsee/shared/routes'

import { Starring } from '../components'

import { ProjectsModule, ProjectNode } from './list.module'
import { TextImage, Cell } from './style'

const stackTokens: IStackTokens = {
  childrenGap: 8,
}

const IconMap = {
  [GitHost.Gitlab]: GitlabIcon,
  [GitHost.Github]: GithubIcon,
}

const ProjectItem = ({ project }: { project: ProjectNode }) => {
  const Icon = IconMap[project.host]
  const history = useHistory()

  const gotoProject = useCallback(() => {
    history.push(pathFactory.project.home({ projectId: project.id }))
  }, [history, project])

  return (
    <Cell verticalAlign="center" horizontal={true} tokens={stackTokens} onClick={gotoProject}>
      <TextImage src="" imageFit={ImageFit.cover} width={40} height={40} title={project.name} />
      <Stack verticalAlign="space-between">
        <Stack verticalAlign="center" horizontal={true} tokens={stackTokens}>
          <Text styles={{ root: { fontWeight: '600' } }} variant="large">
            {project.id}
          </Text>
          {project.isPublic && (
            <Text styles={{ root: { fontWeight: '600', color: SharedColors.red20 } }} variant="large">
              [Public]
            </Text>
          )}
          <Starring projectId={project.id} />
        </Stack>
        <Stack horizontal verticalAlign="center">
          <Icon />
          <Text variant="small" css={css({ color: NeutralColors.gray140, paddingLeft: '4px' })}>
            {project.namespace}/{project.name}
          </Text>
        </Stack>
      </Stack>
    </Cell>
  )
}

enum ProjectsEnum {
  All = 'all',
  Starred = 'starred',
}

const renderProjectItem = (project?: ProjectNode, index?: number) => {
  if (!project) {
    return null
  }

  if (project.isPublic && index === 0) {
    return (
      <>
        <TeachingBubbleHost
          teachingId="welcome"
          headline="Welcome To Perfsee"
          body={
            <>
              You can check out{' '}
              <Text styles={{ root: { fontWeight: '600', color: SharedColors.red10 } }}>[Public]</Text> project to
              explore more features.
            </>
          }
          directional={DirectionalHint.topCenter}
        >
          <ProjectItem project={project} />
        </TeachingBubbleHost>
      </>
    )
  } else {
    return <ProjectItem project={project} />
  }
}

const GithubButtonStyles = {
  root: {
    backgroundColor: '#000 !important',
    color: '#fff',
  },
}

export const ProjectList = () => {
  const [{ projects, loading, totalCount }, dispatcher] = useModule(ProjectsModule)
  const [starredOnly, setStarredOnly] = useState(false)
  const history = useHistory()

  const [{ page = 1, pageSize = 10, query = '' }, updateQueryString] = useQueryString<{
    page: number
    pageSize: number
    query: string
  }>()

  useEffect(() => {
    dispatcher.getProjects({ page: Number(page), pageSize: Number(pageSize), query, starred: starredOnly })
  }, [dispatcher, starredOnly, page, pageSize, query, history.length])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onQueryChange = useCallback(
    debounce((_e: any, searchValue?: string) => {
      updateQueryString({ page: 1, query: searchValue ?? '' })
    }, 300),
    [updateQueryString],
  )

  const onPageChange = useCallback(
    (page: number, pageSize: number) => {
      updateQueryString({ page, pageSize })
    },
    [updateQueryString],
  )

  const toggleStarredOnlyView = useCallback(
    (item?: PivotItem) => {
      if (!item) {
        return
      }

      setStarredOnly(item.props.itemKey === ProjectsEnum.Starred)
      dispatcher.setPage({ page: 1 })
    },
    [setStarredOnly, dispatcher],
  )

  const content = loading ? (
    <Spinner label="Loading Projects" styles={{ root: { maxWidth: 300, margin: 10 } }} />
  ) : projects.length ? (
    <List items={projects} onRenderCell={renderProjectItem} />
  ) : (
    <Empty
      withIcon={true}
      styles={{ root: { maxWidth: 250, margin: 10 } }}
      title={starredOnly ? 'No Starred Projects' : 'No Projects'}
    />
  )

  return (
    <BodyContainer>
      <BodyPadding>
        <Stack horizontal tokens={{ childrenGap: '8px' }}>
          <Stack.Item grow>
            <Stack horizontal verticalAlign="center">
              <SearchBox
                placeholder="Search projects"
                styles={{ root: { maxWidth: 200 } }}
                defaultValue={query}
                onChange={onQueryChange}
              />
            </Stack>
          </Stack.Item>
          <Link to={staticPath.importGithub}>
            <PrimaryButton text="Import From Github" styles={GithubButtonStyles} />
          </Link>
        </Stack>
        <Pivot
          styles={{ root: { marginTop: 4 } }}
          defaultSelectedKey={ProjectsEnum.All}
          onLinkClick={toggleStarredOnlyView}
        >
          <PivotItem headerText="All Projects" itemKey={ProjectsEnum.All} />
          <PivotItem headerText="Starred Projects" itemKey={ProjectsEnum.Starred} />
        </Pivot>
        {content}
        <Pagination
          key={String(starredOnly)}
          total={totalCount}
          onChange={onPageChange}
          page={page}
          pageSize={pageSize}
          showSizeChanger={true}
          hideOnSinglePage={true}
          pageSizeOptions={[10, 20]}
        />
      </BodyPadding>
    </BodyContainer>
  )
}
