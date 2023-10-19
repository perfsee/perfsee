/* eslint-disable @typescript-eslint/no-misused-promises */

interface DomainInfo {
  cookieCount: number
  selected: boolean
  lastAccessed: number
}

interface SyncSettings {
  cookieConsent: boolean
  autoSync: boolean
  syncTime: string
  syncInterval: string
  lastSync?: number
  token: string
  host: string
  nextSync?: number
}

interface CookieData {
  domain: string
  name: string
  value: string
  path: string
  secure: boolean
  httpOnly: boolean
  sameSite: chrome.cookies.SameSiteStatus
  expirationDate?: number
}

interface SyncResponse {
  success: boolean
  error?: string
}

// background.ts
class CookieSync {
  private static instance: CookieSync

  static getInstance(): CookieSync {
    if (!CookieSync.instance) {
      CookieSync.instance = new CookieSync()
    }
    return CookieSync.instance
  }

  private readonly tabDomains = new Map<number, Set<string>>()
  private settings: SyncSettings = {
    cookieConsent: false,
    autoSync: false,
    syncTime: '13:00',
    syncInterval: '24',
    token: '',
    host: 'https://perfsee.com',
  }

  private constructor() {
    this.setupMessageListeners()
    this.setupCookiesDomainListener()
    void this.loadSettings()
    chrome.runtime.onInstalled.addListener(() => {
      this.checkMissedSync().catch(console.error)
    })
    chrome.runtime.onStartup.addListener(() => {
      this.checkMissedSync().catch(console.error)
    })
  }

  async syncCookies(): Promise<SyncResponse> {
    try {
      if (!(await chrome.storage.local.get('cookieConsent')).cookieConsent) {
        return { success: false, error: 'No consent for data upload' }
      }

      const selectedDomains = await this.getSelectedDomains()
      if (selectedDomains.length === 0) {
        return { success: false, error: 'No domain selected' }
      }

      const cookies = await this.getCookiesForDomains(selectedDomains)

      const resp = await fetch(`${this.settings.host}/api/v1/uploadCookies`, {
        method: 'POST',
        body: JSON.stringify(cookies),
        headers: {
          Authorization: `Bearer ${this.settings.token}`,
          'content-type': 'application/json',
        },
      })

      if (!resp.ok) {
        return {
          success: false,
          error: await resp.text(),
        }
      }

      await chrome.storage.local.set({ lastSync: Date.now() })
      return { success: true }
    } catch (error) {
      console.error('Sync failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      }
    }
  }

  async updateNextSyncTime() {
    await chrome.storage.local.set({ nextSync: Date.now() + (Number(this.settings.syncInterval) || 0) * 3600 * 1000 })
  }

  private async loadSettings(): Promise<void> {
    const result = (await chrome.storage.local.get([
      'cookieConsent',
      'autoSync',
      'syncTime',
      'syncInterval',
      'token',
      'host',
    ])) as SyncSettings

    this.settings = {
      cookieConsent: result.cookieConsent || false,
      autoSync: result.autoSync || false,
      syncTime: result.syncTime || '13:00',
      syncInterval: result.syncInterval || '24',
      token: result.token,
      host: result.host || 'https://perfsee.com',
    }

    if (this.settings.autoSync) {
      await this.setupSyncSchedule()
    }
  }

  private setupCookiesDomainListener() {
    chrome.webRequest.onBeforeRequest.addListener(
      (details) => {
        if (details.tabId >= 0) {
          const url = new URL(details.url)
          const domains = this.tabDomains.get(details.tabId) || new Set()
          domains.add(url.hostname)

          const parts = url.hostname.split('.')
          for (let i = 1; i < parts.length - 1; i++) {
            const upperDomain = parts.slice(i).join('.')
            domains.add(upperDomain)
            domains.add('.' + upperDomain)
          }

          this.tabDomains.set(details.tabId, domains)
        }
        return undefined
      },
      { urls: ['http://*/*', 'https://*/*'] },
    )

    chrome.tabs.onRemoved.addListener((tabId) => {
      this.tabDomains.delete(tabId)
    })
  }

  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      switch (message.action) {
        case 'syncCookies':
          this.syncCookies()
            .then(sendResponse)
            .catch((error) =>
              // @ts-expect-error
              sendResponse({
                success: false,
                error: error instanceof Error ? error.message : 'Sync failed',
              }),
            )
          return true

        case 'updateSyncSettings':
          this.updateSyncSettings(message.settings)
            .then(sendResponse)
            .catch((error) =>
              // @ts-expect-error
              sendResponse({
                success: false,
                error: error instanceof Error ? error.message : 'Update failed',
              }),
            )
          return true
        case 'getTabDomains':
          const domains = this.tabDomains.get(message.tabId) || new Set()
          // @ts-expect-error
          sendResponse({ domains: Array.from(domains) })
          break
        default:
          // @ts-expect-error
          sendResponse({ success: false, error: 'Unkown operation' })
          return false
      }
    })

    chrome.storage.onChanged.addListener((changes) => {
      let needUpdateSchedule = false

      for (const [key, { newValue }] of Object.entries(changes)) {
        switch (key) {
          case 'autoSync':
            this.settings.autoSync = newValue
            needUpdateSchedule = true
            break
          case 'syncTime':
            this.settings.syncTime = newValue
            needUpdateSchedule = true
            break
          case 'syncInterval':
            this.settings.syncInterval = newValue
            needUpdateSchedule = true
            break
          case 'cookieConsent':
            this.settings.cookieConsent = newValue
            break
          case 'token':
            this.settings.token = newValue
            break
          case 'host':
            this.settings.host = newValue
            break
        }
      }

      if (needUpdateSchedule) {
        void this.setupSyncSchedule()
      }
    })
  }

  private async updateSyncSettings(newSettings: SyncSettings): Promise<SyncResponse> {
    try {
      await chrome.storage.local.set(newSettings)
      this.settings = { ...this.settings, ...newSettings }

      if (this.settings.autoSync) {
        await this.setupSyncSchedule()
      } else {
        await this.clearSyncSchedule()
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to update sync settings:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update settings',
      }
    }
  }

  private async checkMissedSync() {
    if (!this.settings.autoSync) {
      return
    }
    const intervalHours = parseInt(this.settings.syncInterval)
    const { nextSync } = await chrome.storage.local.get('nextSync')
    if (!nextSync) {
      return this.setupSyncSchedule()
    }
    let nextSyncTime = Number(nextSync) || 0
    if (Date.now() >= nextSyncTime) {
      await this.syncCookies()
      do {
        nextSyncTime += intervalHours * 3600 * 1000
      } while (Date.now() >= nextSyncTime)
    }
    await this.clearSyncSchedule()
    await chrome.alarms.create('cookieSync', {
      when: nextSyncTime,
      periodInMinutes: intervalHours * 60,
    })
    await chrome.storage.local.set({ nextSyncTime })
  }

  private async setupSyncSchedule(): Promise<void> {
    try {
      await this.clearSyncSchedule()

      if (!this.settings.autoSync) {
        return
      }

      const [hours, minutes] = this.settings.syncTime.split(':').map(Number)
      if (isNaN(hours) || isNaN(minutes)) {
        throw new Error('invalid time')
      }

      const intervalHours = parseInt(this.settings.syncInterval)
      if (isNaN(intervalHours)) {
        throw new Error('invalid interval')
      }

      const now = new Date()
      const nextSync = new Date(now)
      nextSync.setHours(hours, minutes, 0, 0)

      if (nextSync.getTime() <= now.getTime()) {
        nextSync.setDate(nextSync.getDate() + 1)
      }

      await chrome.alarms.create('cookieSync', {
        when: nextSync.getTime(),
        periodInMinutes: intervalHours * 60,
      })
      await chrome.storage.local.set({ nextSync: nextSync.getTime() })
    } catch (error) {
      console.error('Failed to setup sync schedule:', error)
      throw error
    }
  }

  private async clearSyncSchedule(): Promise<void> {
    await chrome.alarms.clear('cookieSync')
    await chrome.storage.local.remove('nextSync')
  }

  private async getSelectedDomains(): Promise<string[]> {
    const { syncDomains = {} } = await chrome.storage.local.get('syncDomains')
    return Object.entries(syncDomains as Record<string, DomainInfo>)
      .filter(([_, info]: [string, DomainInfo]) => info.selected)
      .map(([domain]) => domain)
  }

  private async getCookiesForDomains(domains: string[]): Promise<CookieData[]> {
    const allCookies = await chrome.cookies.getAll({})
    return allCookies
      .filter(
        (cookie) =>
          cookie.domain && domains.some((domain) => cookie.domain.endsWith(domain) || domain.endsWith(cookie.domain)),
      )
      .map((cookie) => ({
        domain: cookie.domain,
        name: cookie.name,
        value: cookie.value,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
        expirationDate: cookie.expirationDate,
      }))
  }
}

CookieSync.getInstance()

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cookieSync') {
    void CookieSync.getInstance().updateNextSyncTime()
    void CookieSync.getInstance().syncCookies()
  }
})
