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

import { PartitionOutlined } from '@ant-design/icons'
import { SelectionMode, HoverCard, HoverCardType, DirectionalHint, IPlainCardProps } from '@fluentui/react'
import { useMemo, useCallback, useState, FC, memo } from 'react'

import { TableColumnProps, Table } from '@perfsee/components'
import {
  OLD_SOURCE_CODE_PATH,
  SOURCE_CODE_PATH,
  WEBPACK_INTERNAL_PATH,
  OLD_WEBPACK_INTERNAL_PATH,
  Size,
  AssetInfo,
  EntryDiff,
  getDefaultSize,
  addSize,
} from '@perfsee/shared'

import { ByteSizeWithDiff, ColoredSize } from '../components'
import {
  TableHeaderFilterWrap,
  PackageLoadTypeContent,
  PackageLoadTypeHead,
  PackageLoadTypeSpan,
  PackageLoadTypeWrap,
  TraceIconWrap,
} from '../style'

import { ImportTraceModal } from './import-trace-modal'
import { PackageCard } from './package-card'
import { PackageFilter, Package } from './package-filter'

function getPackagePath(path: string) {
  return path === OLD_SOURCE_CODE_PATH
    ? SOURCE_CODE_PATH
    : path === OLD_WEBPACK_INTERNAL_PATH
    ? WEBPACK_INTERNAL_PATH
    : path
}

const renderIssuersCard = (issuers: string[]) => {
  return (
    <ul style={{ paddingRight: '20px' }}>
      {issuers.map((issuer) => (
        <li key={issuer}>{issuer === OLD_SOURCE_CODE_PATH ? SOURCE_CODE_PATH : issuer}</li>
      ))}
    </ul>
  )
}

const renderNotesCard = (notes: string[]) => {
  return (
    <ul style={{ paddingRight: '20px' }}>
      {notes.map((note, i) => (
        <li key={i}>{note}</li>
      ))}
    </ul>
  )
}

const renderPackageCard = (pkg: Package) => {
  return <PackageCard pkg={pkg} />
}

const getAssetType = (asset: AssetInfo) => {
  if (asset.intermediate) {
    return 'intermediate'
  }

  if (asset.initial) {
    return 'initial'
  }

  return 'async'
}

type LoadInner = {
  size: Size
  list: Record<string, Size>
}

type LoadType = {
  intermidiate?: LoadInner
  initial?: LoadInner
  async?: LoadInner
}

interface Props {
  diff: EntryDiff
}

export const PackagesTable: FC<Props> = ({ diff }) => {
  const { packagesDiff, packageIssueMap, assetsDiff } = diff
  const [filterPackages, setFilterPackages] = useState<Package[] | null>(null)
  const [traceSourceRef, setTraceSourceRef] = useState<number | null>(null)

  const onChangePackages = useCallback((packages: Package[] | null) => {
    setFilterPackages(packages)
  }, [])

  const onShowTraceModal = useCallback(
    (ref: number) => () => {
      setTraceSourceRef(ref)
    },
    [],
  )

  const onHideTraceModal = useCallback(() => {
    setTraceSourceRef(null)
  }, [])

  const onChangeSource = useCallback((ref: number) => {
    setTraceSourceRef(ref)
  }, [])

  const allPackages = useMemo(() => {
    const packagesMap = new Map<string, Package>(
      (packagesDiff?.current ?? []).map((p) => {
        const path = getPackagePath(p.path)
        return [
          path,
          {
            ...p,
            path,
            base: null,
          },
        ]
      }),
    )

    packagesDiff?.baseline?.forEach((basePackage) => {
      const path = getPackagePath(basePackage.path)
      const newPackage = packagesMap.get(path)

      if (newPackage) {
        newPackage.base = basePackage.size
      } else {
        packagesMap.set(path, { ...basePackage, path, size: getDefaultSize(), base: basePackage.size, issuers: [] })
      }
    })

    return Array.from(packagesMap.values())
  }, [packagesDiff])

  const packages = useMemo(() => filterPackages ?? allPackages, [allPackages, filterPackages])

  const packagesLoadTypeMap = useMemo(() => {
    const map = new Map<number, LoadType>()

    for (const asset of assetsDiff.current) {
      if (!asset.packageRefs) {
        continue
      }

      const type = getAssetType(asset)
      for (const { ref, size } of asset.packageRefs) {
        const raw = map.get(ref) ?? {}
        raw[type] = {
          size: addSize(raw[type]?.size ?? getDefaultSize(), size),
          list: {
            ...(raw[type]?.list ?? {}),
            [asset.name]: size,
          },
        }

        map.set(ref, raw)
      }
    }

    return map
  }, [assetsDiff])

  const columns = useMemo<TableColumnProps<Package>[]>(
    () => [
      {
        key: 'name',
        name: 'Name',
        minWidth: 200,
        maxWidth: 400,
        onRenderHeader: () => {
          return (
            <TableHeaderFilterWrap>
              <span>Name</span>
              <PackageFilter packages={allPackages} onChangePackages={onChangePackages} />
            </TableHeaderFilterWrap>
          )
        },
        onRender: (pkg) => {
          if (pkg.path === SOURCE_CODE_PATH || pkg.path === WEBPACK_INTERNAL_PATH) {
            return pkg.path
          }

          return (
            <HoverCard
              type={HoverCardType.plain}
              plainCardProps={{
                renderData: pkg,
                onRenderPlainCard: renderPackageCard,
                gapSpace: 10,
              }}
              instantOpenOnClick={true}
            >
              <a>
                {pkg.name}
                {pkg.version && `@${pkg.version}`}
              </a>
            </HoverCard>
          )
        },
      },
      {
        key: 'size',
        name: 'size',
        minWidth: 100,
        maxWidth: 200,
        onRender: (pkg) => <ByteSizeWithDiff current={pkg.size} baseline={pkg.base} hideIfNonComparable={true} />,
        sorter: (pkg1, pkg2) => pkg1.size.raw - pkg2.size.raw,
        isSorted: true,
        isSortedDescending: true,
      },
      {
        key: 'type',
        name: 'Type',
        minWidth: 100,
        maxWidth: 200,
        onRender: (pkg) => {
          const loadType = packagesLoadTypeMap.get(pkg.ref) ?? {}

          return <PackageLoadType loadType={loadType} />
        },
      },
      {
        key: 'issuers',
        name: 'Issuers',
        minWidth: 100,
        maxWidth: 200,
        onRender: (pkg) => {
          if (!pkg.issuers.length) {
            return null
          }

          return (
            <HoverCard
              type={HoverCardType.plain}
              plainCardProps={{
                onRenderPlainCard: renderIssuersCard,
                renderData: pkg.issuers,
                directionalHint: DirectionalHint.bottomRightEdge,
                gapSpace: 10,
              }}
              instantOpenOnClick={true}
            >
              <a>(count: {pkg.issuers.length})</a>
            </HoverCard>
          )
        },
      },
      {
        key: 'operation',
        name: 'Trace',
        minWidth: 100,
        maxWidth: 100,
        onRender: (pkg) => {
          if (pkg.name === SOURCE_CODE_PATH) {
            return null
          }

          return (
            <>
              <TraceIconWrap onClick={onShowTraceModal(pkg.ref)}>
                <PartitionOutlined />
              </TraceIconWrap>
            </>
          )
        },
      },
      {
        key: 'notes',
        name: 'Notes',
        minWidth: 100,
        onRender: (pkg) => {
          if (!pkg.notes?.length) {
            return null
          }

          return (
            <HoverCard
              type={HoverCardType.plain}
              plainCardProps={{
                onRenderPlainCard: renderNotesCard,
                renderData: pkg.notes,
                directionalHint: DirectionalHint.bottomRightEdge,
                gapSpace: 10,
              }}
              instantOpenOnClick={true}
            >
              <a>(count: {pkg.notes.length})</a>
            </HoverCard>
          )
        },
      },
    ],
    [allPackages, onChangePackages, onShowTraceModal, packagesLoadTypeMap],
  )

  if (!packagesDiff) {
    return null
  }

  return (
    <>
      <Table
        items={packages}
        selectionMode={SelectionMode.none}
        columns={columns}
        disableVirtualization={allPackages.length < 50}
      />
      <ImportTraceModal
        traceSourceRef={traceSourceRef}
        packageIssueMap={packageIssueMap}
        onClose={onHideTraceModal}
        onChangeSource={onChangeSource}
      />
    </>
  )
}

type PackageLoadTypeProps = {
  loadType: LoadType
}

const PackageLoadType: FC<PackageLoadTypeProps> = memo(({ loadType }) => {
  const plainCardProps: IPlainCardProps = {
    onRenderPlainCard: () => {
      return (
        <PackageLoadTypeWrap>
          {Object.entries(loadType).map(([type, { size, list }]) => (
            <PackageLoadTypeContent key={type}>
              <PackageLoadTypeHead>
                [<PackageLoadTypeSpan>{type}</PackageLoadTypeSpan> <ColoredSize size={size} hoverable={false} />]
              </PackageLoadTypeHead>
              {Object.entries(list)
                .sort(([, sizeA], [, sizeB]) => sizeB.raw - sizeA.raw)
                .map(([key, innerSize]) => (
                  <div key={key}>
                    {key}: <ColoredSize size={innerSize} hoverable={false} />
                  </div>
                ))}
            </PackageLoadTypeContent>
          ))}
        </PackageLoadTypeWrap>
      )
    },
  }

  return (
    <HoverCard type={HoverCardType.plain} plainCardProps={plainCardProps}>
      <PackageLoadTypeSpan>{Object.keys(loadType).join('/')}</PackageLoadTypeSpan>
    </HoverCard>
  )
})
