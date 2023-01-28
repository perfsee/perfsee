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

import styled from '@emotion/styled'
import { Breadcrumb, DirectionalHint, IBreadcrumbItem, Pivot, PivotItem, Stack } from '@fluentui/react'
import { useModuleState } from '@sigi/react'
import { useCallback, useMemo } from 'react'
import { useHistory, useParams } from 'react-router'

import { ForeignLink, TeachingBubbleHost } from '@perfsee/components'
import { useBreadcrumb } from '@perfsee/components/breadcrumb'
import { resetLink } from '@perfsee/dls'
import { GitHostIconMap } from '@perfsee/platform/icons'
import { Permission } from '@perfsee/schema'
import { CommonGitHost } from '@perfsee/shared'
import { pathFactory, RouteTypes, staticPath } from '@perfsee/shared/routes'

import { Starring } from '../components'
import { ProjectModule } from '../shared'

export enum NavItem {
  Home = 'home',
  Bundle = 'bundle',
  Lab = 'lab',
  Source = 'source',
  Competitor = 'competitor',
  Settings = 'settings',
}

export const NavContainer = styled(Stack)(({ theme }) => ({
  position: 'sticky',
  top: theme.layout.headerHeight,
  zIndex: 3,
  backgroundColor: theme.colors.white,
  paddingTop: '3px',
}))

export const NavProjectInfoContainer = styled.div(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '50px',
  padding: `0px ${theme.layout.mainPadding}`,
  backgroundColor: theme.colors.primaryBackground,
  borderBottom: `1px solid ${theme.border.color}`,
}))

export const NavFeaturesContainer = styled.div(({ theme }) => ({
  padding: `0px ${theme.layout.mainPadding}`,
  height: '44px',
  borderBottom: `1px solid ${theme.border.color}`,
}))

const ProjectAvatar = styled.div(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: `1px solid ${theme.colors.primary}`,
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  color: theme.colors.primary,
  fontSize: '12px',
  marginRight: '8px',
  fontWeight: 500,
  textTransform: 'uppercase',
}))

const RepoLink = styled(ForeignLink)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  color: theme.text.color,
  fontSize: '14px',
  ':hover': {
    marginBottom: '-1px',
    textDecoration: 'none',
    borderBottom: '1px solid ' + theme.text.color,
  },
  ...resetLink(theme.text.color),
}))

const BreadcrumbStyles = {
  root: { marginTop: 0 },
  itemLink: { fontSize: 14, ':visited': { color: 'inherit' } },
  item: { fontSize: 14 },
}

export const ProjectNav = () => {
  const history = useHistory()
  const routeParams = useParams<RouteTypes['project']['feature']>()
  const breadcrumbItems = useBreadcrumb()

  const project = useModuleState(ProjectModule, {
    selector: (state) => state.project,
    dependencies: [],
  })
  const isAdminUser = project?.userPermission.includes(Permission.Admin) ?? false

  const handleLinkClick = useCallback(
    (item?: PivotItem) => {
      if (!item || routeParams.feature === item.props.itemKey) {
        return
      }

      history.push(pathFactory.project.feature({ ...routeParams, feature: item.props.itemKey }))
    },
    [history, routeParams],
  )

  const breadcrumb = useMemo(() => {
    if (!project) {
      return []
    }

    return [
      {
        text: 'Projects',
        key: 'projects',
        isCurrentItem: false,
        onClick: () => {
          history.push(staticPath.projects)
        },
      },
      ...(breadcrumbItems ?? []).map(
        (item, index, array) =>
          ({
            text: item.text,
            key: item.href,
            isCurrentItem: index === array.length - 1,
            role: 'link',
            onClick: (e) => {
              if (e?.metaKey) {
                window.open(item.href, '_blank')
              } else {
                history.push(item.href)
              }
            },
            onRenderContent:
              index === 0
                ? (props, defaultRender) => (
                    <>
                      <ProjectAvatar>{project.id.substring(0, 2)}</ProjectAvatar>
                      {defaultRender?.(props)}
                    </>
                  )
                : undefined,
          } as IBreadcrumbItem),
      ),
    ]
  }, [breadcrumbItems, history, project])

  const gitHostRepoUrl = useMemo(() => project && new CommonGitHost(project).repoUrl(), [project])

  if (!project) {
    return null
  }

  const GitHostIcon = GitHostIconMap[project.host] ?? GitHostIconMap['Unknown']

  return (
    <NavContainer>
      <NavProjectInfoContainer>
        <Breadcrumb key={breadcrumb.map((item) => item.key).join('|')} styles={BreadcrumbStyles} items={breadcrumb} />
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: '32px' }}>
          <RepoLink href={gitHostRepoUrl ?? undefined}>
            <GitHostIcon />
            <span>
              {project.namespace}/{project.name}
            </span>
          </RepoLink>
          <Starring projectId={project.id} button />
        </Stack>
      </NavProjectInfoContainer>
      <NavFeaturesContainer>
        <TeachingBubbleHost
          teachingId="project-home-modules"
          headline="Switch Feature Modules"
          body="Perfsee is split into multiple functional modules, click here to switch between them."
          directional={DirectionalHint.bottomCenter}
          delay={500}
        >
          <Pivot onLinkClick={handleLinkClick} selectedKey={routeParams.feature} styles={{ root: { height: '100%' } }}>
            {Object.entries(NavItem).map(
              ([key, val]) =>
                (key !== NavItem.Settings || isAdminUser) && (
                  <PivotItem key={key} itemKey={val} headerText={key} itemIcon={val} />
                ),
            )}
          </Pivot>
        </TeachingBubbleHost>
      </NavFeaturesContainer>
    </NavContainer>
  )
}
