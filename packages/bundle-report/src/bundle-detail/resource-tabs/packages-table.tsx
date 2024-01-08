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
import { SelectionMode, HoverCard, HoverCardType } from '@fluentui/react'
import { useMemo, useCallback, useState, FC, MouseEvent } from 'react'

import { TableColumnProps, Table, TooltipWithEllipsis, ForeignLink } from '@perfsee/components'
import { lighten } from '@perfsee/dls'
import {
  OLD_SOURCE_CODE_PATH,
  SOURCE_CODE_PATH,
  WEBPACK_INTERNAL_PATH,
  OLD_WEBPACK_INTERNAL_PATH,
  AssetInfo,
  EntryDiff,
  getDefaultSize,
  addSize,
  BundleAuditScore,
} from '@perfsee/shared'

import { ByteSizeWithDiff } from '../components'
import { TableHeaderFilterWrap, TraceIconWrap } from '../style'
import { ItemAudit } from '../types'

import { ImportTraceModal } from './import-trace-modal'
import { PackageCard, packageSuggestions } from './package-card'
import { PackageFilter, Package } from './package-filter'
import { onPackageTableRenderRow, LoadType } from './package-table-row'
import { useAuditScore } from './use-audit-score'

function getPackagePath(path: string) {
  return path === OLD_SOURCE_CODE_PATH
    ? SOURCE_CODE_PATH
    : path === OLD_WEBPACK_INTERNAL_PATH
    ? WEBPACK_INTERNAL_PATH
    : path
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

interface PackageRow extends Package {
  audits: ItemAudit[]
}

interface Props {
  diff: EntryDiff
}

export const PackagesTable: FC<Props> = ({ diff }) => {
  const { packagesDiff, packageIssueMap, assetsDiff, audits } = diff
  const [filterPackages, setFilterPackages] = useState<Package[] | null>(null)
  const [traceSourceRef, setTraceSourceRef] = useState<number | null>(null)

  const scoreItemsMap = useAuditScore()

  const onChangePackages = useCallback((packages: Package[] | null) => {
    setFilterPackages(packages)
  }, [])

  const onShowTraceModal = useCallback(
    (ref: number) => (e: MouseEvent<HTMLElement>) => {
      e.stopPropagation()
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

  const packageAuditMap: Record<string, ItemAudit[]> = useMemo(() => {
    const packageAuditMap: Record<string, ItemAudit[]> = {}
    audits.current.forEach((audit) => {
      if (audit.score === BundleAuditScore.Good) {
        return
      }
      audit.detail?.items.forEach((i) => {
        const key = (i as Record<string, any>).name || (i as Record<string, any>).path || (i as string)
        if (!key) {
          return
        }
        packageAuditMap[key] ||= []
        packageAuditMap[key].push({
          desc: (i as Record<string, any>).desc || audit.desc,
          title: audit.title,
          score: audit.score,
          link: audit.link,
        })
      })
    })
    return packageAuditMap
  }, [audits])

  const packages: PackageRow[] = useMemo(() => {
    return (filterPackages ?? allPackages).map((p) => {
      const audits = packageAuditMap[p.path] || packageAuditMap[p.name] || []
      const suggestion = packageSuggestions.get(p.name)
      if (suggestion) {
        audits.push({
          title: 'Package suggestion',
          desc: suggestion,
          score: BundleAuditScore.Notice,
        })
      }
      return {
        ...p,
        audits,
      }
    })
  }, [allPackages, filterPackages, packageAuditMap])

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

  const columns = useMemo<TableColumnProps<PackageRow>[]>(
    () => [
      ...(Object.keys(packageAuditMap).length
        ? [
            {
              key: 'audit',
              name: '',
              minWidth: 16,
              maxWidth: 16,
              onRender: (pkg: PackageRow) => {
                const lowestScore = pkg.audits.sort((a, b) => a.score - b.score)[0]?.score || null
                const scoreItem = lowestScore && lowestScore < BundleAuditScore.Good ? scoreItemsMap[lowestScore] : null
                const auditTooltipContent = (
                  <ul style={{ paddingLeft: 24 }}>
                    {pkg.audits.map((a, i) => (
                      <li key={i}>
                        <b>{a.title}: </b>
                        {a.desc}
                        {a.link ? <ForeignLink href={a.link}>Learn More</ForeignLink> : null}
                      </li>
                    ))}
                  </ul>
                )
                return (
                  <TooltipWithEllipsis
                    tooltipContent={auditTooltipContent}
                    alwaysShown
                    background={scoreItem ? lighten(scoreItem.color, 0.2) : undefined}
                  >
                    {scoreItem?.icon}
                  </TooltipWithEllipsis>
                )
              },
            },
          ]
        : []),
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
        name: 'Size',
        minWidth: 100,
        maxWidth: 200,
        onRender: (pkg) => (
          <ByteSizeWithDiff
            underline={true}
            current={pkg.size}
            baseline={pkg.base}
            hideIfNonComparable={true}
            showDiffBellow={!!packagesDiff.baseline}
            showNewIfIsNew
          />
        ),
        sorter: (pkg1, pkg2) => pkg1.size.raw - pkg2.size.raw,
        isSorted: true,
        isSortedDescending: true,
      },
      {
        key: 'type',
        name: 'Type',
        minWidth: 100,
        maxWidth: 200,
        sorter: (pkg1, pkg2) => {
          const loadType1 = Object.keys(packagesLoadTypeMap.get(pkg1.ref) ?? {}).join('/')
          const loadType2 = Object.keys(packagesLoadTypeMap.get(pkg2.ref) ?? {}).join('/')
          return loadType1.localeCompare(loadType2)
        },
        onRender: (pkg) => {
          const loadType = packagesLoadTypeMap.get(pkg.ref) ?? {}
          return Object.keys(loadType).join('/')
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

          return <span>count: {pkg.issuers.length}</span>
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

          return <span>count: {pkg.notes.length}</span>
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
              <TraceIconWrap onClick={onShowTraceModal(pkg.ref)} className="button">
                <PartitionOutlined />
              </TraceIconWrap>
            </>
          )
        },
      },
    ],
    [
      allPackages,
      onChangePackages,
      onShowTraceModal,
      packagesLoadTypeMap,
      packagesDiff.baseline,
      scoreItemsMap,
      packageAuditMap,
    ],
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
        onRenderRow={onPackageTableRenderRow(packagesLoadTypeMap)}
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
