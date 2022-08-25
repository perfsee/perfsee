import { Test } from '@nestjs/testing'
import sinon from 'sinon'

import {
  Artifact,
  BundleMessageFilter,
  BundleMessageSource,
  MessageTargetType,
  Setting,
} from '@perfsee/platform-server/db'
import { EmailService } from '@perfsee/platform-server/src/modules/email'
import test, { createMock } from '@perfsee/platform-server/test'

import { EmailNotificationProvider } from '../provider'

import { testBundleNotificationInfo } from './fixture'

test.beforeEach(async (t) => {
  t.context.module = await Test.createTestingModule({ providers: [EmailNotificationProvider] })
    .useMocker(createMock)
    .compile()
})

test('send bundle notification', async (t) => {
  const notificationService = t.context.module.get(EmailNotificationProvider)
  const emailService = t.context.module.get(EmailService)

  await notificationService.sendBundleNotification({
    ...testBundleNotificationInfo,
    artifact: {
      ...testBundleNotificationInfo.artifact,
      issuer: 'test@testing.com',
    } as Artifact,
    projectSetting: {
      ...testBundleNotificationInfo.projectSetting,
      bundleMessageSource: BundleMessageSource.All,
      bundleMessageFilter: BundleMessageFilter.All,
      messageTargetType: MessageTargetType.Issuer,
    } as Setting,
  })
  t.true(
    emailService.sendMail.calledOnceWith(
      sinon.match({
        to: ['test@testing.com'],
      }),
    ),
  )
})
