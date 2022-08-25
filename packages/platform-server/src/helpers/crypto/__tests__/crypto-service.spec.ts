import { Test } from '@nestjs/testing'
import test from 'ava'
import sinon from 'sinon'

import { ConfigModule } from '@perfsee/platform-server/config'

import { CryptoService } from '../crypto-service'

let service: CryptoService
const plainText = 'this is a top secret!'
const encrypted = 'AAAAAAAAAAAAAAAAJW6Ja6rI0iikoZVha4uW2BXAx2wB6w3Juafs9vOLGBl5'

test.before(async () => {
  const module = await Test.createTestingModule({
    imports: [ConfigModule.forRoot({ secret: 'your secret key' })],
    providers: [CryptoService],
  }).compile()
  service = module.get(CryptoService)
})

test('should encrypt correctly', (t) => {
  const stub = sinon.stub(service, 'randomBytes').returns(Buffer.alloc(12, 0))

  const token = service.encrypt(plainText)

  t.is(token, encrypted)

  stub.restore()
})

test('should decrypt correctly', (t) => {
  const stub = sinon.stub(service, 'randomBytes').returns(Buffer.alloc(12, 0))

  const raw = service.decrypt(encrypted)

  t.is(raw, plainText)

  stub.restore()
})

test('should digest correctly', (t) => {
  const stub = sinon.stub(service, 'randomBytes').returns(Buffer.alloc(12, 0))

  const token = service.digest(plainText)

  t.is(token, 'oPcR0lfLFhZzW6ex6BkDu4Ks01tGxNtuQ/YAUlbMACo=')

  stub.restore()
})

test('should return randomBytes with specified length', (t) => {
  const buf = service.randomBytes(10)

  t.is(buf.length, 10)
})

test('should sha256 correctly', (t) => {
  const buf = service.sha256(plainText)

  t.is(buf.toString('base64'), 'BJ+mVd++oyYV80aDnON9T76H+/cp3ny2Cpw2D1Ki3sk=')
})

test('should correctly encrypt password', (t) => {
  const p1 = service.encryptPassword('foobar')
  const p2 = service.encryptPassword('foobar')

  t.not(p1, p2)
  t.true(service.verifyPassword('foobar', p1))
  t.true(service.verifyPassword('foobar', p2))
})
