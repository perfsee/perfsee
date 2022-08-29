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

import { ArrowLeftOutlined } from '@ant-design/icons'
import { MessageBar, MessageBarType, PrimaryButton, Spinner, SpinnerSize, Stack, TextField } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Redirect } from 'react-router'

import { BodyContainer } from '@perfsee/components'
import { ExternalAccount, GitHost } from '@perfsee/schema'
import { pathFactory } from '@perfsee/shared/routes'

import { ConnectedAccountsModule, CreateProjectModule } from '../shared'

import { Installation } from './github-installation.module'
import { Repository } from './github-repository.module'
import { InstallationSelector } from './installation-selector'
import { RepositorySelector } from './repository-selector'
import { CenterText, Container, DisplayInformation, Title } from './style'

const loadingIconProps = { iconName: 'loading' }

export const ImportGithub = () => {
  const [{ connectedAccounts, loading }, dispatch] = useModule(ConnectedAccountsModule)
  const [{ createdProject, creating, idVerification, idVerifying }, createProjectDispatch] =
    useModule(CreateProjectModule)
  const [installation, setInstallation] = useState<{ id: number; name: string } | null>(null)
  const [repository, setRepository] = useState<{
    host: GitHost.Github
    artifactBaselineBranch: string
    name: string
    namespace: string
  } | null>(null)
  const [id, setId] = useState<string | null>(null)

  useEffect(() => {
    dispatch.getConnectedAccounts()

    return dispatch.reset
  }, [dispatch, createProjectDispatch])

  useEffect(() => createProjectDispatch.reset, [createProjectDispatch])

  const githubAccount = useMemo(() => {
    if (connectedAccounts) {
      return connectedAccounts.find((account) => account.provider === ExternalAccount.github)
    }
  }, [connectedAccounts])

  const handleSelectInstallation = useCallback(
    (installation: Installation) => setInstallation({ name: installation.account.login, id: installation.id }),
    [],
  )
  const handleBackStep1 = useCallback(() => setInstallation(null), [])
  const handleSelectRepository = useCallback(
    (repo: Repository) => {
      const [namespace, name] = repo.full_name.split('/')
      setRepository({
        host: GitHost.Github,
        artifactBaselineBranch: repo.default_branch,
        name,
        namespace,
      })
      setId(name.toLowerCase())
      createProjectDispatch.verifyId(name.toLowerCase())
    },
    [createProjectDispatch],
  )
  const handleBackStep2 = useCallback(() => setRepository(null), [])

  const onIdChange = useCallback(
    (_e: any, value?: string) => {
      const id = value?.trim() || ''
      createProjectDispatch.verifyId(id)
      setId(id)
    },
    [createProjectDispatch],
  )

  const onSubmit = useCallback(() => {
    if (!repository || !id) {
      return
    }
    createProjectDispatch.createProject({
      id,
      host: repository.host,
      namespace: repository.namespace,
      name: repository.name,
      artifactBaselineBranch: repository.artifactBaselineBranch,
    })
  }, [createProjectDispatch, repository, id])

  if (createdProject) {
    return (
      <Redirect
        to={pathFactory.project.home({
          projectId: createdProject.id,
        })}
      />
    )
  }

  return (
    <BodyContainer>
      <Container>
        <Stack tokens={{ childrenGap: 16 }}>
          <Title>Import Projects From Github</Title>
          {
            /* loading */
            loading || creating ? (
              <Spinner size={SpinnerSize.large} />
            ) : /* if no github account */
            !githubAccount?.externUsername ? (
              <MessageBar messageBarType={MessageBarType.blocked}>
                Please{' '}
                <a
                  href={`/oauth2/login?returnUrl=${encodeURIComponent(location.href)}&provider=${
                    ExternalAccount.github
                  }`}
                >
                  connect github account
                </a>{' '}
                first.
              </MessageBar>
            ) : /* step 1 */
            installation === null ? (
              <>
                <CenterText>Step 1: Choose account</CenterText>
                <br />

                <InstallationSelector onSelect={handleSelectInstallation} />
              </>
            ) : repository === null ? (
              /* step 2 */ <>
                <CenterText>Step 2: Choose repository</CenterText>
                <br />

                <a onClick={handleBackStep1}>
                  <ArrowLeftOutlined /> Back to choose account
                </a>

                <RepositorySelector installationId={installation.id} onSelect={handleSelectRepository} />

                <DisplayInformation variant="small">Account: {installation.name}</DisplayInformation>
              </>
            ) : (
              /* step 3 */ <>
                <CenterText>Step 3: Confirm information</CenterText>
                <br />

                <a onClick={handleBackStep2}>
                  <ArrowLeftOutlined /> Back to choose repository
                </a>

                <TextField
                  placeholder="id"
                  onChange={onIdChange}
                  value={id || ''}
                  errorMessage={idVerifying ? undefined : idVerification?.error || undefined}
                  label="ID"
                  iconProps={idVerifying ? loadingIconProps : undefined}
                  required
                />

                <PrimaryButton onClick={onSubmit} disabled={idVerifying || !idVerification?.ok}>
                  Create project
                </PrimaryButton>

                <DisplayInformation variant="small">Account: {installation.name}</DisplayInformation>
                <DisplayInformation variant="small">
                  Repository: {repository.namespace}/{repository.name}
                </DisplayInformation>
              </>
            )
          }
        </Stack>
      </Container>
    </BodyContainer>
  )
}
