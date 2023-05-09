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

import { ForkOutlined } from '@ant-design/icons'
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
import { useEffect, useCallback, useState, useMemo } from 'react'
import { Link, useHistory } from 'react-router-dom'

import {
  Pagination,
  BodyContainer,
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
import { useSettings } from '../shared'

import { ProjectsModule, ProjectNode, OrgNode } from './list.module'
import { PackageList } from './package-list'
import { CreateProjectAction } from './project-actions'
import { TextImage, Cell } from './style'

const stackTokens: IStackTokens = {
  childrenGap: 8,
}

const IconMap: { [key in GitHost]: React.ComponentType } = {
  [GitHost.Gitlab]: GitlabIcon,
  [GitHost.Github]: GithubIcon,
  [GitHost.Unknown]: ForkOutlined,
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

const GroupItem = ({ org }: { org: OrgNode }) => {
  const history = useHistory()

  const gotoGroup = useCallback(() => {
    history.push(pathFactory.group.home({ groupId: org.id }))
  }, [history, org])

  return (
    <Cell verticalAlign="center" horizontal={true} tokens={stackTokens} onClick={gotoGroup}>
      <TextImage src="" imageFit={ImageFit.cover} width={40} height={40} title={org.id} />
      <Stack verticalAlign="space-between">
        <Stack verticalAlign="center" horizontal={true} tokens={stackTokens}>
          <Text styles={{ root: { fontWeight: '600' } }} variant="large">
            {org.id}
          </Text>
        </Stack>
      </Stack>
    </Cell>
  )
}

enum ProjectsEnum {
  Project = 'project',
  Package = 'package',
  Starred = 'starred',
  Group = 'group',
}

const PROJECTS_LOCAL_STORAGE_KEY = 'perfsee_home_page'

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

const renderOrgItem = (org?: OrgNode) => {
  if (!org) {
    return null
  }
  return <GroupItem org={org} />
}

const GithubButtonStyles = {
  root: {
    backgroundColor: '#000 !important',
    color: '#fff',
  },
}

export const ProjectList = () => {
  const [{ projects, loading, totalCount, groupTotalCount, groups, packages, packageTotalCount }, dispatcher] =
    useModule(ProjectsModule)
  const [pivotKey, setPivotKey] = useState<ProjectsEnum>(
    () => localStorage[PROJECTS_LOCAL_STORAGE_KEY] ?? ProjectsEnum.Project,
  )
  const history = useHistory()
  const settings = useSettings()

  const [{ page = 1, pageSize = 10, query = '' }, updateQueryString] = useQueryString<{
    page: number
    pageSize: number
    query: string
  }>()

  useEffect(() => {
    switch (pivotKey) {
      case ProjectsEnum.Group:
        dispatcher.getGroups({
          page: Number(page),
          pageSize: Number(pageSize),
          query,
        })
        break
      case ProjectsEnum.Project:
      case ProjectsEnum.Starred:
        dispatcher.getProjects({
          page: Number(page),
          pageSize: Number(pageSize),
          query: String(query),
          starred: pivotKey === ProjectsEnum.Starred,
        })
        break
      case ProjectsEnum.Package:
        dispatcher.getPackages({
          page: Number(page),
          pageSize: Number(pageSize),
          query: String(query),
          starred: false,
        })
    }
  }, [dispatcher, page, pageSize, query, history.length, pivotKey])

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

  const onPivotChange = useCallback(
    (item?: PivotItem) => {
      if (!item) {
        return
      }

      setPivotKey(item.props.itemKey as ProjectsEnum)
      localStorage.setItem(PROJECTS_LOCAL_STORAGE_KEY, item.props.itemKey ?? ProjectsEnum.Project)
      dispatcher.setPage({ page: 1 })
    },
    [dispatcher],
  )

  const empty = (
    <Empty
      withIcon={true}
      styles={{ root: { maxWidth: 250, margin: 10 } }}
      title={
        pivotKey === ProjectsEnum.Starred
          ? 'No Starred Projects'
          : pivotKey === ProjectsEnum.Project
          ? 'No Projects'
          : pivotKey === ProjectsEnum.Package
          ? 'No Pacakges'
          : 'No Groups'
      }
    />
  )

  const content = (() => {
    if (loading) {
      return (
        <Spinner
          label={`Loading ${
            pivotKey === ProjectsEnum.Group ? 'Group' : pivotKey === ProjectsEnum.Package ? 'Pacakges' : 'Projects'
          }`}
          styles={{ root: { maxWidth: 300, margin: 10 } }}
        />
      )
    }
    if (pivotKey === ProjectsEnum.Group) {
      return groups.length ? <List items={groups} onRenderCell={renderOrgItem} css={css({ minHeight: 700 })} /> : empty
    }

    if (pivotKey === ProjectsEnum.Package) {
      return packages.length ? <PackageList packages={packages} /> : empty
    }

    return projects.length ? (
      <List items={projects} onRenderCell={renderProjectItem} css={css({ minHeight: 700 })} />
    ) : (
      empty
    )
  })()

  const placeholder = useMemo(() => {
    switch (pivotKey) {
      case ProjectsEnum.Package:
        return 'Search packages'
      case ProjectsEnum.Starred:
        return 'Search starred'
      case ProjectsEnum.Group:
        return 'Search groups'
      case ProjectsEnum.Project:
      default:
        return 'Search projects'
    }
  }, [pivotKey])

  return (
    <BodyContainer>
      <Stack horizontal tokens={{ childrenGap: '8px' }}>
        <Stack.Item grow>
          <Stack horizontal verticalAlign="center">
            <SearchBox
              placeholder={placeholder}
              styles={{ root: { maxWidth: 240, minWidth: 240 } }}
              defaultValue={query}
              onChange={onQueryChange}
            />
          </Stack>
        </Stack.Item>
        {settings.enableProjectCreate && <CreateProjectAction />}
        {settings.enableProjectImport && (
          <Link to={staticPath.importGithub}>
            <PrimaryButton text="Import From Github" styles={GithubButtonStyles} />
          </Link>
        )}
      </Stack>
      <Pivot styles={{ root: { marginTop: 4 } }} defaultSelectedKey={pivotKey} onLinkClick={onPivotChange}>
        <PivotItem headerText="Projects" itemKey={ProjectsEnum.Project} />
        <PivotItem headerText="Packages" itemKey={ProjectsEnum.Package} />
        <PivotItem headerText="Starred Projects" itemKey={ProjectsEnum.Starred} />
        <PivotItem headerText="Groups" itemKey={ProjectsEnum.Group} />
      </Pivot>
      {content}
      <Pagination
        key={pivotKey}
        total={
          pivotKey === ProjectsEnum.Group
            ? groupTotalCount
            : pivotKey === ProjectsEnum.Package
            ? packageTotalCount
            : totalCount
        }
        onChange={onPageChange}
        page={page}
        pageSize={pageSize}
        showSizeChanger={true}
        hideOnSinglePage={true}
        pageSizeOptions={[10, 20]}
      />
    </BodyContainer>
  )
}
