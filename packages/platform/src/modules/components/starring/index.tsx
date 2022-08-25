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

import { IButtonStyles, IconButton, IIconProps } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useCallback, MouseEvent, FC } from 'react'

import { SharedColors } from '@perfsee/dls'

import { UserModule } from '../../shared'

const getIconProps = (starred: boolean): IIconProps => {
  const styles = { root: { color: SharedColors.red20, height: 16, fontSize: 16 } }
  if (starred) {
    return { iconName: 'StarFilled', styles }
  }
  return { iconName: 'StarOutlined', styles }
}

const starIconButtonStyle: IButtonStyles = {
  root: { width: 22, height: 22 },
}

interface StarringProps {
  projectId: string
}

export const Starring: FC<StarringProps> = ({ projectId }) => {
  const [starred, dispatcher] = useModule(UserModule, {
    selector: (state) => state.user?.starredProjects?.includes(projectId) ?? false,
    dependencies: [projectId],
  })

  const toggleStarred = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      dispatcher.toggleStaringProject({ projectId, star: !starred })
    },
    [projectId, dispatcher, starred],
  )

  return <IconButton iconProps={getIconProps(starred)} styles={starIconButtonStyle} onClick={toggleStarred} />
}
