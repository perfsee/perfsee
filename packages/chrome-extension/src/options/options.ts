/* eslint-disable @typescript-eslint/no-misused-promises */

class DomainManager {
  private readonly domains: Map<string, DomainInfo> = new Map()

  constructor() {
    this.initializeListeners()
    void this.loadDomains()
  }

  private initializeListeners(): void {
    document.getElementById('refreshDomains')?.addEventListener('click', () => this.loadDomains())

    document
      .getElementById('searchDomain')
      ?.addEventListener('input', (e) => this.filterDomains((e.target as HTMLInputElement).value))

    document.getElementById('selectAll')?.addEventListener('click', () => this.toggleAll(true))

    document.getElementById('deselectAll')?.addEventListener('click', () => this.toggleAll(false))
  }

  private async loadDomains(): Promise<void> {
    const cookies = await chrome.cookies.getAll({})
    const { syncDomains = {} } = await chrome.storage.local.get('syncDomains')

    this.domains.clear()
    cookies.forEach((cookie) => {
      const domain = cookie.domain
      if (!this.domains.has(domain)) {
        this.domains.set(domain, {
          cookieCount: 1,
          selected: syncDomains[domain]?.selected ?? false,
          lastAccessed: syncDomains[domain]?.lastAccessed ?? 0,
        })
      } else {
        const domainInfo = this.domains.get(domain)!
        domainInfo.cookieCount++
      }
    })

    await this.updateDomainFrequency()
    this.renderDomainLists()
    this.updateStats()
  }

  private async updateDomainFrequency(): Promise<void> {
    const tabs = await chrome.tabs.query({})
    const currentTime = Date.now()

    tabs.forEach((tab) => {
      try {
        const url = new URL(tab.url!)
        const domain = url.hostname
        if (this.domains.has(domain)) {
          const domainInfo = this.domains.get(domain)!
          domainInfo.lastAccessed = currentTime
        }
      } catch (e) {
        // ignore
      }
    })
  }

  private createDomainElement(domain: string, info: DomainInfo): HTMLDivElement {
    const div = document.createElement('div')
    div.className = 'domain-item'

    div.innerHTML = `
      <label>
        <input type="checkbox" ${info.selected ? 'checked' : ''} data-domain="${domain}">
        ${domain}
        <span class="domain-info">
          (${info.cookieCount} cookies${info.lastAccessed ? ', recently visited' : ''})
        </span>
      </label>
    `

    const checkbox = div.querySelector('input')!
    checkbox.addEventListener('change', () => this.toggleDomain(domain, checkbox.checked))
    div.addEventListener('click', () => {
      checkbox.checked = !checkbox.checked
      const event = new Event('change')
      checkbox.dispatchEvent(event)
    })

    return div
  }

  private renderDomainLists(): void {
    const frequentContainer = document.getElementById('frequentDomains')!
    const allContainer = document.getElementById('allDomains')!

    frequentContainer.innerHTML = ''
    allContainer.innerHTML = ''

    const sortedDomains = Array.from(this.domains.entries()).sort((a, b) => b[1].lastAccessed - a[1].lastAccessed)

    const frequentDomains = sortedDomains.slice(0, 10)
    frequentDomains.forEach(([domain, info]) => {
      frequentContainer.appendChild(this.createDomainElement(domain, info))
    })

    sortedDomains.forEach(([domain, info]) => {
      allContainer.appendChild(this.createDomainElement(domain, info))
    })
  }

  private async toggleDomain(domain: string, selected: boolean): Promise<void> {
    const domainInfo = this.domains.get(domain)
    if (domainInfo) {
      domainInfo.selected = selected
      await this.saveDomainSettings()
      this.updateStats()
    }
  }

  private async toggleAll(selected: boolean): Promise<void> {
    for (const [_, info] of this.domains) {
      info.selected = selected
    }
    await this.saveDomainSettings()
    this.renderDomainLists()
    this.updateStats()
  }

  private filterDomains(searchText: string): void {
    if (!searchText.trim()) {
      document.querySelectorAll('.domain-item').forEach((element) => {
        ;(element as HTMLElement).style.display = ''
      })
      return
    }

    const searchTerms = searchText.toLowerCase().split(/\s+/)
    const elements = document.querySelectorAll('.domain-item')

    elements.forEach((element) => {
      const domain = element.querySelector('label')!.textContent!.toLowerCase()
      const matches = searchTerms.every((term) => domain.includes(term))
      ;(element as HTMLElement).style.display = matches ? '' : 'none'
    })
  }

  private updateStats(): void {
    const selectedCount = Array.from(this.domains.values()).filter((info) => info.selected).length

    const totalCookies = Array.from(this.domains.values()).length

    const selectedCountElement = document.getElementById('selectedCount')
    const totalCookiesElement = document.getElementById('totalCount')

    if (selectedCountElement) selectedCountElement.textContent = selectedCount.toString()
    if (totalCookiesElement) totalCookiesElement.textContent = totalCookies.toString()
  }

  private async saveDomainSettings(): Promise<void> {
    const settings: Record<string, DomainInfo> = {}
    for (const [domain, info] of this.domains) {
      settings[domain] = {
        selected: info.selected,
        lastAccessed: info.lastAccessed,
        cookieCount: info.cookieCount,
      }
    }
    await chrome.storage.local.set({ syncDomains: settings })
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new DomainManager()
})
