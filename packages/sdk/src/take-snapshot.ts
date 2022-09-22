import { Client } from './client'
import { ConsoleLogger } from './logger'

export interface TakeSnapshotOptions {
  project: string
  token: string
  hash?: string
  envs?: string[]
  pages?: string[]
  profiles?: string[]
  title?: string
  server?: string
}

export async function takeSnapshot(options: TakeSnapshotOptions, logger = ConsoleLogger) {
  logger.log('[Perfsee] Taking snapshot...\n')

  const client = new Client({
    accessToken: options.token,
    host: options.server || 'https://perfsee.com',
  })

  logger.log(`Project: ${options.project}\n`)

  const settings = await client.projectSettings(options.project)

  const pageIds = options.pages?.map((pageName) => {
    const page = settings.pages.find((p) => p.name === pageName)
    if (!page) {
      throw new Error(`Page "${pageName}" not found`)
    }
    return page.id
  })
  logger.log(`Pages: ${pageIds}\n`)

  const envIds = options.envs?.map((envName) => {
    const env = settings.environments.find((e) => e.name === envName)
    if (!env) {
      throw new Error(`Environment "${envName}" not found`)
    }
    return env.id
  })
  logger.log(`Envs: ${envIds}\n`)

  const profileIds = options.profiles?.map((profileName) => {
    const profile = settings.profiles.find((e) => e.name === profileName)
    if (!profile) {
      throw new Error(`Profile "${profileName}" not found`)
    }
    return profile.id
  })
  logger.log(`Profiles: ${profileIds}\n`)

  const snapshot = await client.takeSnapshot(
    options.project,
    pageIds ?? [],
    profileIds,
    envIds,
    options.title,
    options.hash,
  )

  logger.log(`Created snapshot #${snapshot.id}\n`)
}
