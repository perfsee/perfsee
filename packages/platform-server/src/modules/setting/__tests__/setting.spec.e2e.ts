import { omit } from 'lodash'

import { Project, Setting, User } from '@perfsee/platform-server/db'
import test, { initTestDB, GraphQLTestingClient } from '@perfsee/platform-server/test'
import {
  basicSettingsQuery,
  BundleMessageFilter,
  BundleMessageSource,
  LabMessageSource,
  MessageTargetType,
  updateProjectSettingsMutation,
} from '@perfsee/schema'

let gqlClient: GraphQLTestingClient
let project: Project
let user: User

test.before(async () => {
  gqlClient = new GraphQLTestingClient()

  await initTestDB()

  project = await Project.findOneByOrFail({ id: 1 })
  user = await User.findOneByOrFail({ id: 1 })

  await Setting.create({
    projectId: project.id,
  }).save()
})

test.serial('get project setting', async (t) => {
  const response = await gqlClient.query({
    query: basicSettingsQuery,
    variables: {
      projectId: project.slug,
    },
  })

  t.is(response.project.setting.bundleMessageBranches.length, 0)
  t.is(response.project.setting.bundleMessageSource, BundleMessageSource.All)
  t.is(response.project.setting.bundleMessageFilter, BundleMessageFilter.All)
  t.is(response.project.setting.labMessageSource, LabMessageSource.All)
  t.is(response.project.setting.messageTargetType, MessageTargetType.Issuer)
  t.is(response.project.setting.messageTarget.userEmails.length, 0)
})

test.serial('update project setting', async (t) => {
  const input = {
    bundleMessageSource: BundleMessageSource.Branch,
    bundleMessageFilter: BundleMessageFilter.Warning,
    bundleMessageBranches: ['main'],
    labMessageSource: LabMessageSource.Warning,
    messageTargetType: MessageTargetType.Specified,
    messageTarget: {
      userEmails: [user.email],
    },
  }

  const updateResponse = await gqlClient.mutate({
    mutation: updateProjectSettingsMutation,
    variables: {
      projectId: project.slug,
      settingsInput: input,
    },
  })

  // get project settings again
  const response = await gqlClient.query({
    query: basicSettingsQuery,
    variables: {
      projectId: project.slug,
    },
  })

  t.deepEqual(omit(updateResponse.updateProjectSettings, '__typename'), input)
  t.deepEqual(omit(response.project.setting, '__typename'), input)
})
