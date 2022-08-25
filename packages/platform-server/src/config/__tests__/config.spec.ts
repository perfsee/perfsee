import { Test } from '@nestjs/testing'
import test from 'ava'
import Sinon from 'sinon'

import { Config, ConfigModule } from '..'

let config: Config
test.beforeEach(async () => {
  const module = await Test.createTestingModule({
    imports: [ConfigModule.forRoot()],
  }).compile()
  config = module.get(Config)
})

test('should be able to get config', (t) => {
  t.assert(typeof config.host === 'string')
  t.is(config.secret, 'your-application-secret-key')
})

test('should be able to get config specified by env', (t) => {
  t.is(config.testing, true)
})

test('should be able to override config', (t) => {
  const stub = Sinon.stub(config, 'getter').withArgs('host').returns('testing')

  t.is(config.host, 'testing')
  t.assert(stub.calledOnceWith('host'))
})
