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
import { NeutralColors, SharedColors } from '@fluentui/theme'

import { JobLogLevel } from '@perfsee/shared'

import { Log as LogType } from './module'

export const PageWrapper = styled('div')({
  width: '100%',
  margin: '20px auto',
  display: 'flex',
  alignItems: 'flex-end',
  flexDirection: 'column',
  justifyContent: 'stretch',
})

export const LogsWrapper = styled('div')({
  height: 'calc(100% - 40px)',
  width: '100%',
  background: NeutralColors.gray200,
  padding: '8px 0',
  overflow: 'hidden scroll',
})

const logColors = {
  [JobLogLevel.verbose]: {
    color: NeutralColors.gray30,
  },
  [JobLogLevel.info]: {
    color: SharedColors.cyanBlue10,
  },
  [JobLogLevel.warn]: {
    color: SharedColors.yellow10,
  },
  [JobLogLevel.error]: {
    color: SharedColors.red10,
  },
}

const Line = styled('p')<{ level: JobLogLevel; hasChildren?: boolean }>(({ level, hasChildren }) => ({
  padding: '1px 16px 1px 20px',
  marginBottom: 2,
  fontSize: 12,
  position: 'relative',
  ...logColors[level],
  ':hover': {
    backgroundColor: NeutralColors.gray150,
  },
  '::before': {
    content: hasChildren ? '">"' : '""',
    position: 'absolute',
    left: 10,
    color: 'white',
    transition: 'transform .1s linear',
  },
}))

const Time = styled('span')({
  color: SharedColors.orange10,
})

const ChildrenLogs = styled('div')({
  display: 'none',
  paddingLeft: '10px',
})

const LogPayload = styled(({ payload, className, id }: { payload: any; id: number; className?: string }) => {
  return (
    <div className={className}>
      <input id={`payload-${id}`} type="checkbox" style={{ display: 'none' }} />
      <div>
        <label htmlFor={`payload-${id}`}>payload</label>
        <pre>{JSON.stringify(payload, null, 2)}</pre>
      </div>
    </div>
  )
})({
  paddingLeft: 26,
  color: NeutralColors.gray40,
  fontSize: 12,

  label: {
    color: NeutralColors.gray100,
    position: 'relative',
    '::after': {
      content: '"  (collapsed)"',
    },

    '+ pre': {
      display: 'none',
      margin: 0,
      paddingLeft: 10,
    },
  },

  '& input:checked + div': {
    label: {
      '::after': {
        content: '""',
      },
      '+ pre': {
        display: 'block',
      },
    },
  },
})

export const Log = styled(({ log, className }: { log: LogType; className?: string }) => {
  return (
    <div>
      <input
        className={className}
        id={`checkbox-${log.id}`}
        type="checkbox"
        style={{ display: 'none' }}
        defaultChecked={true}
      />
      {log.children ? (
        <div>
          <label htmlFor={`checkbox-${log.id}`}>
            <Line level={log.level} hasChildren={!!log.children}>
              {log.message} <Time>+{log.elapsed}ms</Time>
            </Line>
          </label>
          {!!log.payload && <LogPayload payload={log.payload} id={log.id} />}
          <ChildrenLogs>
            {log.children.map((log, j) => (
              <Line key={`${log.level}-${j}`} level={log.level}>
                {log.message} <Time>+{log.elapsed}ms</Time>
              </Line>
            ))}
          </ChildrenLogs>
        </div>
      ) : (
        <div>
          <Line level={log.level} hasChildren={!!log.children}>
            {log.message} <Time>+{log.elapsed}ms</Time>
          </Line>
          {!!log.payload && <LogPayload payload={log.payload} id={log.id} />}
        </div>
      )}
    </div>
  )
})({
  '+ div label': {
    cursor: 'pointer',
  },
  ':checked': {
    [`+ div ${ChildrenLogs}`]: {
      display: 'block',
    },
    [`+ div ${Line}::before`]: {
      transform: 'rotate(90deg)',
    },
  },
})
