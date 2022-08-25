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

import { formatTime, detectThirdPartyProvider } from '@perfsee/platform/common'
import { Task } from '@perfsee/tracehouse'

import { StyledTooltip, StyledItem } from './style'

type Props = {
  data: Task
}

export const ExecutionChartTooltip = ({ data }: Props) => {
  const dur = formatTime(data.duration)
  const start = formatTime(data.startTime)
  const [source, frame] = data.attributableURLs
  const provider = frame && detectThirdPartyProvider(source)

  return (
    <StyledTooltip>
      <h3>
        {data.event.name}&nbsp;({dur.value}
        {dur.unit})
      </h3>
      <div>
        <StyledItem>
          <b>startTime: </b>
          {start.value}
          {start.unit}
        </StyledItem>
        {frame && (
          <StyledItem>
            <b>Source: </b>
            <p>{source}</p>
          </StyledItem>
        )}
        {provider && (
          <StyledItem>
            <b>ThirdParty: </b>
            <p>{provider.name}</p>
          </StyledItem>
        )}
      </div>
    </StyledTooltip>
  )
}
