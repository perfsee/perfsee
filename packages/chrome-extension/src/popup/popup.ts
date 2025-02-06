/* eslint-disable @typescript-eslint/no-misused-promises */

function validateDomain(domain: string) {
  const domainRegex =
    /^https?:\/\/[a-zA-Z0-9](?:[-a-zA-Z0-9]*[a-zA-Z0-9])?(\.[a-zA-Z0-9](?:[-a-zA-Z0-9]*[a-zA-Z0-9])?)*(:(\d{1,5}))?(\/[a-zA-Z0-9-._~!$&'()*+,;=:@/]*)?$/
  return domainRegex.test(domain)
}

class PopupManager {
  private consentCheckbox: HTMLInputElement
  private autoSyncCheckbox: HTMLInputElement
  private syncTimeInput: HTMLInputElement
  private syncIntervalSelect: HTMLSelectElement
  private readonly uploadBtn: HTMLButtonElement
  private statusDiv: HTMLDivElement
  private lastSyncDiv: HTMLLinkElement
  private nextSyncDiv: HTMLDivElement
  private readonly consentDetailDiv: HTMLDivElement
  private readonly tokenInput: HTMLInputElement
  private readonly tokenVisibilityBtn: HTMLButtonElement
  private readonly toggleConsentDetailBtn: HTMLButtonElement
  private readonly hostSelect: HTMLInputElement
  private readonly tokenLink: HTMLLinkElement
  private readonly optionsList: HTMLElement
  private readonly options: HTMLElement[]
  private readonly copyCookiesBtn: HTMLButtonElement

  constructor() {
    this.consentCheckbox = document.getElementById('consentCheckbox') as HTMLInputElement
    this.autoSyncCheckbox = document.getElementById('autoSyncCheckbox') as HTMLInputElement
    this.syncTimeInput = document.getElementById('syncTime') as HTMLInputElement
    this.syncIntervalSelect = document.getElementById('syncInterval') as HTMLSelectElement
    this.uploadBtn = document.getElementById('uploadBtn') as HTMLButtonElement
    this.statusDiv = document.getElementById('status') as HTMLDivElement
    this.lastSyncDiv = document.getElementById('lastSync') as HTMLLinkElement
    this.nextSyncDiv = document.getElementById('nextSync') as HTMLDivElement
    this.consentDetailDiv = document.getElementById('consentDetails') as HTMLDivElement
    this.tokenInput = document.getElementById('perfsee-token') as HTMLInputElement
    this.tokenVisibilityBtn = document.getElementById('show-token-btn') as HTMLButtonElement
    this.toggleConsentDetailBtn = document.getElementById('details-toggle') as HTMLButtonElement
    this.hostSelect = document.getElementById('platform-domain') as HTMLInputElement
    this.tokenLink = document.getElementById('token-link') as HTMLLinkElement
    this.optionsList = document.querySelector('.options-list') as HTMLElement
    this.options = [...this.optionsList.querySelectorAll('.option')] as HTMLElement[]
    this.copyCookiesBtn = document.getElementById('copyButton') as HTMLButtonElement

    void this.initializePopup()
  }

  private async initializePopup(): Promise<void> {
    await this.loadSettings()
    this.setupEventListeners()
    this.syncTimeInput.parentElement!.style.display = this.autoSyncCheckbox.checked ? 'flex' : 'none'
    this.syncIntervalSelect.parentElement!.style.display = this.autoSyncCheckbox.checked ? 'flex' : 'none'
  }

  private async loadSettings(): Promise<void> {
    const [settings, domains] = await Promise.all([
      chrome.storage.local.get([
        'cookieConsent',
        'autoSync',
        'syncTime',
        'syncInterval',
        'lastSync',
        'token',
        'host',
        'nextSync',
      ]) as Promise<SyncSettings>,
      chrome.storage.local.get('syncDomains') as Promise<{ syncDomains?: Record<string, DomainInfo> }>,
    ])

    this.consentCheckbox.checked = settings.cookieConsent || false
    this.autoSyncCheckbox.checked = settings.autoSync || false
    this.syncTimeInput.value = settings.syncTime || '13:00'
    this.syncIntervalSelect.value = settings.syncInterval || '24'
    this.tokenInput.value = settings.token || ''
    this.hostSelect.value = settings.host || 'https://perfsee.com'

    if (settings.lastSync) {
      this.lastSyncDiv.textContent = `Last Sync: ${new Date(settings.lastSync).toLocaleString()}`
      this.lastSyncDiv.href = `${settings.host}/me/cookies`
    }

    if (settings.nextSync) {
      this.nextSyncDiv.textContent = `Next Sync: ${new Date(settings.nextSync).toLocaleString()}`
    }

    const selectedCount = Object.values(domains.syncDomains || {}).filter((info) => info.selected).length
    const selectedCountElement = document.getElementById('selectedDomainCount')
    if (selectedCountElement) {
      selectedCountElement.textContent = selectedCount.toString()
    }
  }

  private setupEventListeners(): void {
    this.consentCheckbox.addEventListener('change', () => this.updateSettings())
    this.autoSyncCheckbox.addEventListener('change', async () => {
      this.syncTimeInput.parentElement!.style.display = this.autoSyncCheckbox.checked ? 'flex' : 'none'
      this.syncIntervalSelect.parentElement!.style.display = this.autoSyncCheckbox.checked ? 'flex' : 'none'
      await this.updateSettings()
    })
    this.syncTimeInput.addEventListener('change', () => this.updateSettings())
    this.syncIntervalSelect.addEventListener('change', () => this.updateSettings())
    this.tokenInput.addEventListener('change', () => this.updateSettings())
    this.tokenVisibilityBtn.addEventListener('click', () => this.toggleTokenVisibility())
    this.toggleConsentDetailBtn.addEventListener('click', () => this.toggleDetails())
    this.uploadBtn.addEventListener('click', () => this.syncNow())
    this.hostSelect.addEventListener('change', () => {
      const value = this.hostSelect.value.trim()
      const isValid = validateDomain(value)

      this.hostSelect.classList.toggle('error', !isValid)

      let errorMessage = this.hostSelect.parentNode!.querySelector('.error-message')
      if (!errorMessage) {
        errorMessage = document.createElement('div')
        errorMessage.className = 'error-message'
        this.hostSelect.parentNode!.appendChild(errorMessage)
      }

      if (!isValid) {
        errorMessage.textContent = 'Please enter a valid host'
        errorMessage.classList.add('visible')
        return
      } else {
        errorMessage.classList.remove('visible')
      }

      this.tokenLink.href = `${this.hostSelect.value}/me/access-token`
      void this.updateSettings()
    })

    this.hostSelect.addEventListener('focus', () => {
      this.optionsList.classList.add('active')
    })

    document.body.addEventListener('click', (e: Event) => {
      if (!this.hostSelect.contains(e.target as Node)) {
        this.optionsList.classList.remove('active')
      }
    })

    this.options.forEach((option) => {
      option.addEventListener('click', () => {
        this.hostSelect.value = option.dataset.value!
        this.optionsList.classList.remove('active')
        this.hostSelect.dispatchEvent(new Event('change'))

        this.options.forEach((opt) => opt.classList.remove('selected'))
        option.classList.add('selected')
      })
    })

    document.getElementById('openDomainSettings')?.addEventListener('click', () => {
      void chrome.runtime.openOptionsPage()
    })

    this.copyCookiesBtn.addEventListener('click', () => this.copyCurrentTabCookies())
  }

  private async copyCurrentTabCookies() {
    const originText = this.copyCookiesBtn.textContent
    const originClassnames = this.copyCookiesBtn.className
    try {
      const [currentTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      })

      if (!currentTab?.url) {
        throw new Error('No active tab found')
      }

      const domains: string[] = (
        await chrome.runtime.sendMessage({ action: 'getTabDomains', tabId: currentTab.id })
      ).domains.concat(new URL(currentTab.url).hostname)

      const cookies = await chrome.cookies.getAll({})

      const relevantCookies = cookies.filter((cookie) => {
        return domains.some((domain) => domain.includes(cookie.domain))
      })

      const cookieStr = JSON.stringify(relevantCookies)

      await navigator.clipboard.writeText(cookieStr)

      this.copyCookiesBtn.textContent = 'Copied'
      this.copyCookiesBtn.classList.add('success')
      this.copyCookiesBtn.disabled = true
    } catch (error: any) {
      console.error('Failed to copy cookies:', error)
      this.copyCookiesBtn.textContent = `Failed to copy cookies: ${String(error)}`
      this.copyCookiesBtn.disabled = true
      this.copyCookiesBtn.classList.add('error')
    } finally {
      setTimeout(() => {
        this.copyCookiesBtn.textContent = originText
        this.copyCookiesBtn.disabled = false
        this.copyCookiesBtn.className = originClassnames
      }, 2000)
    }
  }

  private toggleDetails() {
    const chevron = this.toggleConsentDetailBtn.querySelector('.chevron')!

    if (this.consentDetailDiv.style.display === 'none') {
      this.consentDetailDiv.style.display = 'block'
      chevron.classList.add('expanded')
    } else {
      this.consentDetailDiv.style.display = 'none'
      chevron.classList.remove('expanded')
    }
  }

  private toggleTokenVisibility() {
    const tokenInput = document.getElementById('perfsee-token')! as HTMLInputElement
    const currentType = tokenInput.type

    tokenInput.type = currentType === 'password' ? 'text' : 'password'
  }

  private async updateSettings(): Promise<void> {
    const settings: SyncSettings = {
      cookieConsent: this.consentCheckbox.checked,
      autoSync: this.autoSyncCheckbox.checked,
      syncTime: this.syncTimeInput.value,
      syncInterval: this.syncIntervalSelect.value,
      token: this.tokenInput.value,
      host: this.hostSelect.value.trim(),
    }

    try {
      const response = (await chrome.runtime.sendMessage({
        action: 'updateSyncSettings',
        settings: settings,
      })) as SyncResponse

      if (!response.success) {
        this.statusDiv.textContent = 'Update failed:' + response.error
        this.statusDiv.className = 'error'
      }
    } catch (error) {
      console.error('Failed to update settings:', error)
      this.statusDiv.textContent = 'Update failed: ' + String(error)
      this.statusDiv.className = 'error'
    }

    const { nextSync } = await chrome.storage.local.get('nextSync')
    if (nextSync) {
      this.nextSyncDiv.textContent = `Next Sync: ${new Date(nextSync).toLocaleString()}`
    } else {
      this.nextSyncDiv.textContent = ''
    }
  }

  private async syncNow(): Promise<void> {
    if (!this.consentCheckbox.checked) {
      this.statusDiv.textContent = 'Please agree to upload cookies'
      this.statusDiv.className = 'error'
      return
    }

    if (!this.tokenInput.value) {
      this.statusDiv.textContent = 'Please paste your perfsee token'
      this.statusDiv.className = 'error'
      return
    }

    if (!validateDomain(this.hostSelect.value)) {
      this.statusDiv.textContent = 'Please enter a valid host'
      this.statusDiv.className = 'error'
      return
    }

    this.statusDiv.className = ''
    this.uploadBtn.textContent = 'Synchronizing...'
    this.uploadBtn.disabled = true

    try {
      const response = (await chrome.runtime.sendMessage({
        action: 'syncCookies',
      })) as SyncResponse

      if (response.success) {
        this.statusDiv.textContent = 'Sync success!'
        this.statusDiv.className = 'success'
        const now = new Date().toLocaleString()
        this.lastSyncDiv.textContent = `Last Sync: ${now}`
        this.lastSyncDiv.href = `${this.hostSelect.value}/me/cookies`
      } else {
        this.statusDiv.textContent = 'Sync failed:' + response.error
        this.statusDiv.className = 'error'
      }
    } catch (error) {
      this.statusDiv.textContent = 'Sync failed:' + (error instanceof Error ? error.message : 'Unkown Error')
      this.statusDiv.className = 'error'
      console.error('Sync failed:', error)
    } finally {
      this.uploadBtn.textContent = 'Sync Now'
      this.uploadBtn.disabled = false
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PopupManager()
})
