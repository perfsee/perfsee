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

import { Spinner, Stack, Separator } from '@fluentui/react'
import { useEffect, useState } from 'react'

import { ForeignLink } from '@perfsee/components'

const packageSuggestions = new Map<string, string>([
  ['moment', 'use dayjs to reduce size.'],
  ['lodash', 'use lodash-es for better modularization or import plugin to minimize package size'],
])

interface PackageInfo {
  name: string
  description: string
  latestVersion: string
  license: string
  homepage?: string
  'dist-tags'?: {
    latest: string
  }
}

async function getPackageInfo(name: string) {
  try {
    const response = await fetch(`https://registry.npmjs.com/${name}`)
    return (await response.json()) as PackageInfo
  } catch (e) {
    return null
  }
}

export const PackageCard = ({ pkg }: { pkg: { name?: string; version?: string } }) => {
  const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null)

  useEffect(() => {
    setPackageInfo(null)
    void getPackageInfo(pkg.name!)
      .catch(() => null)
      .then((packageInfo) => setPackageInfo(packageInfo))

    return () => setPackageInfo(null)
  }, [pkg.name])

  if (!packageInfo) {
    return <Spinner label="loading" styles={{ root: { margin: 10 } }} />
  }

  const suggestion = packageSuggestions.get(pkg.name!)

  return (
    <Stack styles={{ root: { padding: 10 } }} tokens={{ childrenGap: 10 }}>
      <Stack.Item>{packageInfo.description}</Stack.Item>
      <Stack.Item>
        Latest version: {packageInfo.latestVersion ?? packageInfo['dist-tags']?.latest ?? 'unknown'}
      </Stack.Item>
      <Stack.Item>Used Version: {pkg.version ?? 'unknown'}</Stack.Item>
      <Stack.Item>License: {packageInfo.license}</Stack.Item>
      <Stack.Item>
        <ForeignLink href={packageInfo.homepage}>{packageInfo.homepage}</ForeignLink>
      </Stack.Item>
      {!!suggestion && (
        <>
          <Separator />
          <Stack.Item>{suggestion}</Stack.Item>
        </>
      )}
    </Stack>
  )
}
