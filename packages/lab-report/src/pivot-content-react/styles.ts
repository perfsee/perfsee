import styled from '@emotion/styled'
import { Stack } from '@fluentui/react'
import { CommunicationColors, NeutralColors, SharedColors } from '@fluentui/theme'

export const ChartNodeGroup = styled.g`
  transition: all ease-in-out 250ms;
`
export const ChartNodeRect = styled.rect`
  cursor: pointer;
  stroke: ${({ theme }) => theme.colors.white};
  transition: all ease-in-out 250ms;
`

export const ChartNodeForeginObject = styled.foreignObject`
  pointer-events: none;
  transition: all ease-in-out 250ms;
`

export const ChartNodeDiv = styled.div`
  pointer-events: none;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  margin-left: 0.25rem;
  margin-right: 0.25rem;
  line-height: 1.5;
  padding: 0 0 0;
  font-weight: 400;
  text-align: left;
  transition: all ease-in-out 250ms;
`

export const NoCommitData = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`

export const NoCommitDataHeader = styled.div`
  margin-bottom: 0.5rem;
`

export const Container = styled.div`
  width: 100%;
  flex: 1;
  padding: 0.5rem;
  height: calc(95vh - 350px);
  min-height: 500px;
`

export const SidebarToolbar = styled.div`
  height: 2.25rem;
  padding: 0 0.5rem;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.border.color};
`

export const SidebarSelectedComponent = styled.div`
  flex: 1;
  color: ${SharedColors.cyanBlue10};
  white-space: nowrap;
  overflow-x: hidden;
  text-overflow: ellipsis;
`
export const SidebarContent = styled.div`
  padding: 0.5rem;
  user-select: none;
  overflow-y: auto;
`

export const SidebarSelectedLabel = styled.label`
  font-weight: bold;
  margin-bottom: 0.5rem;
`
export const SidebarCommitList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`

export const SidebarCommitListItem = styled.li`
  margin: 0 0 0.5rem;
`

export const SidebarCommitLabel = styled.label`
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: bold;
`

export const SidebarCommitDurationList = styled.ul`
  list-style: none;
  padding: 0;
  background: ${NeutralColors.gray30};
  padding: 0.25rem 0.5rem 0.5rem 0.5rem;
  border-radius: 0.25rem;
`

export const SidebarCommitDurationListItem = styled.li`
  margin: 0.25rem 0 0 0;
`

export const CommitUpdater = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: 0.25rem 0.5rem;
  cursor: pointer;

  &: hover,
  &: focus {
    outline: none;
    background-color: ${CommunicationColors.tint30};
  }
`

export const CommitNoUpdaters = styled.div`
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: 0.25rem 0.5rem;
  color: ${NeutralColors.gray120};
`

export const CommitUpdaters = styled.div`
  margin: 0 0 0.5rem;
`

export const SnapshotCommitOuter = styled.div`
  user-select: none;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  padding-top: 4px;
  padding-bottom: 1px;
  display: flex;
  align-items: flex-end;
`

export const SnapshotCommitInner = styled.div`
  width: 100%;
  min-height: 2px;

  &.selected {
    background-color: ${SharedColors.cyanBlue10};
  }
`
export const SnapshotSelectorContainer = styled(Stack)`
  border-bottom: 1px solid ${({ theme }) => theme.border.color};
`

export const SidebarContainer = styled(Stack)`
  width: 20vw;
  min-width: 200px;
  height: 100%;
  border-left: 1px solid ${({ theme }) => theme.border.color};
`
export const RenderedCommit = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: 0.25rem 0.5rem;
  cursor: pointer;

  &:hover,
  &:focus {
    outline: none;
    background-color: ${CommunicationColors.tint30};
  }

  &.current {
    background-color: ${SharedColors.cyanBlue10};
    color: ${NeutralColors.white};
  }

  &.current:focus {
    outline: none;
  }
`
export const SnapshotSelectorInput = styled.input`
  background: none;
  text-align: right;
  border: 1px solid transparent;
  border-radius: 0.125rem;
  padding: 0.125rem;

  &:focus {
    background-color: ${NeutralColors.gray50};
    outline: none;
  }
`

export const SnapshotTooltipList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`
export const SnapshotTooltipListItem = styled.li`
  display: flex;
`

export const SnapshotTooltipLabel = styled.label`
  font-weight: bold;
  margin-right: 0.25rem;
  &: after {
    content: ':';
  }
`
export const SnapshotTooltipValue = styled.span`
  flex-grow: 1;
  text-align: end;
`

export const SnapshotDurationList = styled.ul`
  list-style: none;
  margin: 0 0 0 1rem;
  padding: 0;
`

export const SnapshotDurationLabel = styled.label`
  margin-right: 0.25rem;
`

export const GraphItemCurrentCommit = styled.div`
  margin: 0.25rem 0;
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
`

export const GraphItemToolbar = styled.div`
  padding: 0.25rem 0;
  margin-bottom: 0.25rem;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  border-bottom: 1px solid ${NeutralColors.gray140};
`

export const GraphItemComponent = styled.div`
  flex: 1;
  font-weight: bold;
  white-space: nowrap;
  overflow-x: hidden;
  text-overflow: ellipsis;
`

export const GraphItemContent = styled.div`
  user-select: none;
  overflow-y: auto;
`

export const WhatChangedComponent = styled.div`
  margin-bottom: 0.5rem;
`

export const WhatChangedItem = styled.div`
  margin-top: 0.25rem;
`

export const WhatChangedLabel = styled.label`
  font-weight: bold;
`

export const WhatChangedKey = styled.span`
  line-height: 1;

  &:first-of-type::before {
    content: ' (';
  }

  &::after {
    content: ', ';
  }

  &:last-of-type::after {
    content: ')';
  }
`
