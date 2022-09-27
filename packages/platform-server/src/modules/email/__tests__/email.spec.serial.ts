import { Test } from '@nestjs/testing'
import nodemailer from 'nodemailer'
import sinon from 'sinon'

import { ConfigModule } from '@perfsee/platform-server/config'
import { Logger } from '@perfsee/platform-server/logger'
import test, { createMock } from '@perfsee/platform-server/test'

import { EmailModule, EmailService } from '..'

const testMail = {
  to: ['example@example.com'],
  subject: 'test subject',
  text: 'test text',
  html: 'test html',
}

const testOptions = {
  smtp: {
    host: 'smtp.example.com',
    port: 465,
    auth: { pass: 'bar', user: 'foo' },
    secure: true,
  },
  from: {
    name: 'boo',
    address: 'cn',
  },
}

let createTransportStub: sinon.SinonStub
let sendMailStub: sinon.SinonStub
test.beforeEach(() => {
  sendMailStub = sinon.stub().resolves({})
  createTransportStub = sinon.stub(nodemailer, 'createTransport').returns({
    sendMail: sendMailStub,
  } as any)
})

test.afterEach(() => {
  createTransportStub.restore()
})

test.serial('missing smtp option', async (t) => {
  t.context.module = await Test.createTestingModule({
    imports: [
      EmailModule,
      ConfigModule.forRoot({
        email: {
          smtp: {} as any,
          from: {} as any,
        },
      }),
    ],
  })
    .useMocker(createMock)
    .compile()

  const email = t.context.module.get(EmailService)
  const logger = t.context.module.get(Logger)
  t.true(logger.warn.called)
  await email.sendMail(testMail)
  t.is(createTransportStub.callCount, 0)
  t.is(sendMailStub.callCount, 0)
})

test.serial('send mail', async (t) => {
  t.context.module = await Test.createTestingModule({
    imports: [
      EmailModule,
      ConfigModule.forRoot({
        email: testOptions,
      }),
    ],
  })
    .useMocker(createMock)
    .compile()

  const email = t.context.module.get(EmailService)
  await email.sendMail(testMail)
  t.true(createTransportStub.calledOnce)
  t.is(createTransportStub.getCall(0).args[0].host, testOptions.smtp.host)
  t.true(sendMailStub.calledOnceWith(sinon.match(testMail)))
})
