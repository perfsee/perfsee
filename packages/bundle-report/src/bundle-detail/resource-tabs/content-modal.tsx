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
import { Modal, Spinner, SpinnerSize } from '@fluentui/react'
import { FC, useEffect, useState } from 'react'

import { ShortcutTips, Header } from '@perfsee/bundle-report/bundle-content/styled'
import { Treemap } from '@perfsee/bundle-report/bundle-content/treemap'
import { AssetInfo, ModuleTreeNode } from '@perfsee/shared'

export interface ContentModalProps {
  asset: AssetInfo | undefined
  getAssetContent: (asset: AssetInfo) => Promise<ModuleTreeNode[]>
  onClose: () => void
}

const ChartWrapper = styled.div({
  height: 'calc(80vh - 40px)',
  padding: '0 12px',
})

export const ContentModal: FC<ContentModalProps> = ({ asset, getAssetContent, onClose }) => {
  const [content, setContent] = useState<ModuleTreeNode[] | null>(null)

  useEffect(() => {
    if (asset) {
      void getAssetContent(asset).then(setContent)
    }
  }, [getAssetContent, asset])

  return (
    <Modal
      isOpen={!!asset}
      onDismiss={onClose}
      styles={{
        main: { width: '80vw', height: '80vh' },
        scrollableContent: {
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignContent: 'center',
          height: '100%',
        },
      }}
    >
      {content ? (
        <ChartWrapper>
          <Header>
            <h3>Asset Content Visulization</h3>
            <ShortcutTips>
              <p>
                i:&nbsp;
                <kbd>Ctrl/Command</kbd> + <kbd>Wheel</kbd> to scale
              </p>
              <p>
                &nbsp;&nbsp;&nbsp;
                <kbd>Ctrl/Command</kbd> + <kbd>F</kbd> to search
              </p>
            </ShortcutTips>
          </Header>
          <Treemap content={content} />
        </ChartWrapper>
      ) : (
        <Spinner size={SpinnerSize.large} />
      )}
    </Modal>
  )
}
