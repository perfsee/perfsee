/* eslint-disable import/no-extraneous-dependencies */
require('ts-node/register/transpile-only')
require('tsconfig-paths/register')
const Sinon = require('sinon')

const timer = Sinon.useFakeTimers({
  shouldAdvanceTime: true,
})

let work

function start() {
  process.on('message', (message) => {
    switch (message.type) {
      case 'start': {
        process.send?.({ type: 'start', payload: undefined })

        let i = 1
        work = setInterval(() => {
          process.send?.({ type: 'log', payload: [`work ${i++}`] })
        }, 1100)

        setTimeout(() => {
          timer.clearInterval(work)
          process.send?.({ type: 'end', payload: undefined })
        }, 4000)
        break
      }
      case 'raise': {
        timer.clearInterval(work)
        process.send?.({ type: 'end', payload: undefined })
        process.send?.({ type: 'raised', payload: undefined })
        break
      }
      // used to fake timers in worker
      case 'tick': {
        timer.tick(message.payload)
        process.send?.({ type: 'ticked' })
        break
      }
      case 'shutdown': {
        process.exit()
      }
    }
  })
  process.send?.({ type: 'alive' })
}

start()
