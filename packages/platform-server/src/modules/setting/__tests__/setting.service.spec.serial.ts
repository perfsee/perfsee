import {
  BundleMessageFilter,
  BundleMessageSource,
  LabMessageSource,
  MessageTargetType,
  Project,
  Setting,
  User,
} from '@perfsee/platform-server/db'
import test, { createDBTestingModule, createMock, initTestDB } from '@perfsee/platform-server/test'

import { SettingService } from '../service'

let project: Project
let user: User
let setting: Setting

test.before(async (t) => {
  t.context.module = await createDBTestingModule({
    providers: [SettingService],
  })
    .useMocker(createMock)
    .compile()

  await initTestDB()

  project = await Project.findOneByOrFail({ id: 1 })
  user = await User.findOneByOrFail({ id: 1 })

  setting = await Setting.create({
    projectId: project.id,
  }).save()
})

test.serial('get setting by loader', async (t) => {
  const service = t.context.module.get(SettingService)

  const data = await service.byProjectLoader.load(project.id)

  t.truthy(data)
  t.is(data!.projectId, project.id)
  t.is(data!.bundleMessageSource, setting.bundleMessageSource)
})

test.serial('update setting', async (t) => {
  const service = t.context.module.get(SettingService)

  await service.updateSetting(project.id, {
    bundleMessageSource: BundleMessageSource.Branch,
    bundleMessageFilter: BundleMessageFilter.Warning,
    bundleMessageBranches: ['main'],
    labMessageSource: LabMessageSource.Warning,
    messageTargetType: MessageTargetType.Specified,
    messageTarget: {
      userEmails: [user.email],
    },
  })

  const settingEntity = await Setting.findOneByOrFail({ projectId: project.id })

  t.truthy(settingEntity)
  t.is(settingEntity.bundleMessageSource, BundleMessageSource.Branch)
  t.is(settingEntity.bundleMessageFilter, BundleMessageFilter.Warning)
  t.deepEqual(settingEntity.bundleMessageBranches, ['main'])
  t.is(settingEntity.labMessageSource, LabMessageSource.Warning)
  t.is(settingEntity.messageTargetType, MessageTargetType.Specified)
  t.deepEqual(settingEntity.messageTarget, { userEmails: [user.email] })
})
