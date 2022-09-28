import { Test } from '@nestjs/testing'
import nodemailer from 'nodemailer'
import sinon from 'sinon'

import { ConfigModule } from '@perfsee/platform-server/config'
import test, { createMock } from '@perfsee/platform-server/test'

import { EmailModule, EmailService } from '..'
import { ApplicationSettingService } from '../../application-setting'

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
    auth: { password: 'bar', user: 'foo' },
    secure: true,
  },
  from: {
    name: 'boo',
    address: 'cn',
  },
}

let createTransportStub: sinon.SinonStub
let sendMailStub: sinon.SinonStub
test.before(() => {
  sendMailStub = sinon.stub().resolves({})
  createTransportStub = sinon.stub(nodemailer, 'createTransport').returns({
    sendMail: sendMailStub,
  } as any)
})

test.after(() => {
  createTransportStub.restore()
})

test.serial('missing smtp option', async (t) => {
  t.context.module = await Test.createTestingModule({
    imports: [
      EmailModule,
      ConfigModule.forRoot({
        email: {
          enable: false,
          smtp: {} as any,
          from: {} as any,
        },
      }),
    ],
  })
    .useMocker(createMock)
    .compile()

  t.context.module.get(ApplicationSettingService).current.resolves(
    // @ts-expect-error partial type
    { enableEmail: false },
  )
  const email = t.context.module.get(EmailService)
  await email.sendMail(testMail)
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

  t.context.module.get(ApplicationSettingService).current.resolves(
    // @ts-expect-error partial type
    { enableEmail: true },
  )

  const email = t.context.module.get(EmailService)
  await email.sendMail(testMail)
  t.true(createTransportStub.calledOnce)
  t.is(createTransportStub.getCall(0).args[0].host, testOptions.smtp.host)
  t.true(sendMailStub.calledOnceWith(sinon.match(testMail)))
})
