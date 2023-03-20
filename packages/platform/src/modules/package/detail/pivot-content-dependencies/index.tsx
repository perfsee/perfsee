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

import { HoverCard, HoverCardType, Shimmer, Stack, Text } from '@fluentui/react'
import { useModuleState } from '@sigi/react'

import { Empty } from '@perfsee/components'

import { PackageBundleDetailModule } from '../module'

import { PackageCard } from './package-card'

const renderPackageCard = (pkg: { name?: string; verison?: string }) => {
  return <PackageCard pkg={pkg} />
}

const renderDependenciesList = (depList: Record<string, string>) => {
  const list = Object.entries(depList).map(([name, version]) => {
    return (
      <HoverCard
        key={name}
        type={HoverCardType.plain}
        plainCardProps={{
          renderData: { name, version },
          onRenderPlainCard: renderPackageCard,
          gapSpace: 10,
        }}
        instantOpenOnClick={true}
      >
        <a>
          {name}
          {version && `@${version}`}
        </a>
      </HoverCard>
    )
  })
  return (
    <Stack horizontal verticalAlign="baseline" wrap tokens={{ childrenGap: '8px 24px' }}>
      {list}
    </Stack>
  )
}

export const DependenciesDetail = () => {
  const { current, loading } = useModuleState(PackageBundleDetailModule)

  if (loading || !current) {
    return <Shimmer />
  }

  const packageJson = current.report?.packageJson
  const dependencies = packageJson?.dependencies
  const devDependenceis = packageJson?.devDependencies
  const optionalDependencies = packageJson?.optionalDependencies
  const peerDependencies = packageJson?.peerDependencies

  if (!packageJson || (!dependencies && !devDependenceis && !optionalDependencies && !peerDependencies)) {
    return <Empty />
  }

  const depList = dependencies ? (
    <Stack>
      <Text variant="xLarge">Dependencies</Text>
      {renderDependenciesList(dependencies)}
    </Stack>
  ) : null

  const devDepList = devDependenceis ? (
    <Stack>
      <Text variant="xLarge">Dev Dependencies</Text>
      {renderDependenciesList(devDependenceis)}
    </Stack>
  ) : null

  const peerDepList = peerDependencies ? (
    <Stack>
      <Text variant="xLarge">Peer Dependencies</Text>
      {renderDependenciesList(peerDependencies)}
    </Stack>
  ) : null

  const optDepList = optionalDependencies ? (
    <Stack>
      <Text variant="xLarge">Optional Dependencies</Text>
      {renderDependenciesList(optionalDependencies)}
    </Stack>
  ) : null

  return (
    <Stack tokens={{ childrenGap: 36, padding: '0 10px' }} style={{ marginTop: 24 }}>
      <Stack.Item>{depList}</Stack.Item>
      <Stack.Item>{devDepList}</Stack.Item>
      <Stack.Item>{peerDepList}</Stack.Item>
      <Stack.Item>{optDepList}</Stack.Item>
    </Stack>
  )
}
