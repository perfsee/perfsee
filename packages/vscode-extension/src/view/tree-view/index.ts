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

import {
  TreeDataProvider,
  TreeItem,
  Event,
  EventEmitter,
  CancellationToken,
  Disposable,
  window,
  TreeView,
  Uri,
  TreeViewOptions,
} from 'vscode'

import Issue from '../../core/issue'
import Logger from '../../utils/logger'

import { IssueNode, IssueNodeDataProvider } from './issues/issue'
import { ProjectIssuesCollapsibleNode, ProjectIssuesCollapsibleNodeDataProvider } from './issues/project'
import { ProjectIssuesRootNodeDataProvider } from './issues/root'
import { ProfileCallDetailNode, ProfileCallDetailNodeProvider } from './performance/profile-call-detail'
import { ProfileStatsNode, ProfileStatsNodeDataProvider } from './performance/profile-stats'
import { PerformanceRootNodeDataProvider } from './performance/root'
import { ProfileNode, ProfileNodeDataProvider } from './projects/profile'
import { ProfilesCollapsibleNode, ProfilesCollapsibleNodeDataProvider } from './projects/profiles-collapsible'
import { ProjectCollapsibleNode, ProjectCollapsibleNodeDataProvider } from './projects/project'
import { ProjectsRootNodeDataProvider } from './projects/root'
import { RootPathSelectionNode, RootPathSelectionNodeDataProvider } from './projects/root-path'
import { CommitsSelectionNode, CommitsSelectionNodeDataProvider } from './projects/versions'
import { TextNode, TextNodeDataProvider } from './shared/text'

/** for vscode subbar  */
export type TreeNode =
  // projects
  | ProjectCollapsibleNode
  | ProfilesCollapsibleNode
  | ProfileNode
  | CommitsSelectionNode
  | RootPathSelectionNode
  // issues
  | ProjectIssuesCollapsibleNode
  | IssueNode
  // performance
  | ProfileStatsNode
  | ProfileCallDetailNode
  // shared
  | TextNode

function nodeDataProviders() {
  return [
    // projects
    new ProjectCollapsibleNodeDataProvider(),
    new ProfilesCollapsibleNodeDataProvider(),
    new ProfileNodeDataProvider(),
    new CommitsSelectionNodeDataProvider(),
    new RootPathSelectionNodeDataProvider(),
    // issues
    new ProjectIssuesCollapsibleNodeDataProvider(),
    new IssueNodeDataProvider(),
    // performance
    new ProfileStatsNodeDataProvider(),
    new ProfileCallDetailNodeProvider(),
    // shared
    new TextNodeDataProvider(),
  ]
}

export type RootNode = undefined

export interface TreeNodeDataProvider<T extends TreeNode | RootNode> {
  readonly type?: T extends TreeNode ? T['type'] : undefined

  onDidChangeTreeData?: Event<void>

  getTreeItem?: T extends TreeNode ? (node: T) => TreeItem | Thenable<TreeItem> : undefined

  getChildren?: (node: T) => TreeNode[] | Thenable<TreeNode[]>

  getParent?: (node: T) => TreeNode | null | undefined | Thenable<TreeNode | null | undefined>

  resolveTreeItem?: (
    item: TreeItem,
    element: T,
    token: CancellationToken,
  ) => TreeItem | null | undefined | Thenable<TreeItem | null | undefined>
}

export class TreeViewController extends Disposable {
  onDidChangeTreeDataEventEmitter = new EventEmitter<void>()
  treeView: TreeView<TreeNode>
  get onDidChangeTreeData() {
    return this.onDidChangeTreeDataEventEmitter.event
  }

  protected readonly dataProvider: TreeDataProvider<TreeNode> = {
    onDidChangeTreeData: this.onDidChangeTreeData,
    getTreeItem: async (element: TreeNode) => {
      try {
        const provider = this.nodeProviders.find((provider) => provider.type === element.type)
        const item = await Promise.resolve<TreeItem | undefined | null>(
          (provider?.getTreeItem as any)?.call(provider, element as any),
        )
        if (!item) {
          throw new Error('Build tree item failed.')
        }
        return item
      } catch (err) {
        // if catch any error, log error and hide this item.
        Logger.debug('getTreeItem Error: ', err)
        return null!
      }
    },
    getChildren: async (element?: TreeNode) => {
      try {
        const provider = !element
          ? this.rootProvider
          : this.nodeProviders.find((provider) => provider.type === element.type)
        return (
          (await Promise.resolve<TreeNode[] | undefined | null>(
            (provider?.getChildren as any)?.call(provider, element),
          )) ?? []
        )
      } catch (err) {
        Logger.debug(err)
        throw err
      }
    },
    getParent: (element: TreeNode) => {
      const provider = this.nodeProviders.find((provider) => provider.type === element.type)
      return Promise.resolve<TreeNode | undefined | null>((provider?.getParent as any)?.call(provider, element))
    },
    resolveTreeItem: async (item, element, cancellationToken) => {
      try {
        const provider = this.nodeProviders.find((provider) => provider.type === element.type)
        return await Promise.resolve<TreeItem | undefined | null>(
          (provider?.resolveTreeItem as any)?.call(provider, item, element, cancellationToken),
        )
      } catch (err) {
        Logger.debug(err)
        throw err
      }
    },
  }

  constructor(
    public readonly viewId: string,
    protected readonly nodeProviders: TreeNodeDataProvider<any>[],
    protected readonly rootProvider: TreeNodeDataProvider<RootNode>,
    options?: Omit<TreeViewOptions<TreeNode>, 'treeDataProvider'>,
  ) {
    super(() => {})
    rootProvider.onDidChangeTreeData?.(() => {
      this.onDidChangeTreeDataEventEmitter.fire()
    })
    this.treeView = window.createTreeView(viewId, {
      treeDataProvider: this.dataProvider,
      ...options,
    })
  }
}

export class IssuesTreeViewController extends TreeViewController {
  constructor(viewId: string) {
    super(viewId, nodeDataProviders(), new ProjectIssuesRootNodeDataProvider(), { showCollapseAll: true })
  }

  reveal(issue: Issue) {
    void this.treeView.reveal({
      type: 'issue',
      data: issue,
    })
  }
}

export class ProjectsTreeViewController extends TreeViewController {
  constructor(viewId: string) {
    super(viewId, nodeDataProviders(), new ProjectsRootNodeDataProvider())
  }
}

export class PerformanceTreeViewController extends TreeViewController {
  get onReady() {
    return (this.rootProvider as PerformanceRootNodeDataProvider).onDidReady
  }

  constructor(viewId: string) {
    super(viewId, nodeDataProviders(), new PerformanceRootNodeDataProvider(), { showCollapseAll: true })
  }

  reveal(uri: Uri) {
    const node = (this.rootProvider as PerformanceRootNodeDataProvider).findStats(uri.fsPath)
    if (node) {
      void this.treeView.reveal({
        type: 'profile-stats-node' as const,
        data: {
          stats: node,
        },
      })
    }
  }
}
