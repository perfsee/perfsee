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

import { RightOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { FC, ReactNode, useCallback, useState } from 'react'

import { NeutralColors } from '@perfsee/dls'

const Header = styled.div<{ spaceBetween?: boolean }>(({ spaceBetween }) => ({
  fontWeight: 500,
  padding: '6px 0',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: spaceBetween ? 'space-between' : 'start',
  userSelect: 'none',
  ':hover': {
    background: NeutralColors.gray20,
  },
}))

const Icon = styled(RightOutlined)<{ open?: boolean }>(({ open }) => ({
  transition: 'transform .2s ease-in-out',
  transform: open ? 'rotate(90deg)' : 'none',
  marginRight: '8px',
}))

interface Props {
  header: string | JSX.Element
  className?: string
  iconPosition?: 'left' | 'right'
  children?: ReactNode
  defaultCollapsed?: boolean
}

export const CollapsiblePanel: FC<Props> = ({
  header,
  children,
  className,
  iconPosition = 'left',
  defaultCollapsed = true,
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  const toggle = useCallback(() => {
    setCollapsed((v) => !v)
  }, [])

  return (
    <div className={className}>
      <Header spaceBetween={iconPosition === 'right'} onClick={toggle}>
        {iconPosition === 'left' ? <Icon open={!collapsed} /> : null}
        {header}
        {iconPosition === 'right' ? <Icon open={!collapsed} /> : null}
      </Header>
      {!collapsed && children}
    </div>
  )
}
