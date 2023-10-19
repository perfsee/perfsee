import { ProtocolService } from './lab/services/lighthouse'

/* eslint-disable @typescript-eslint/no-misused-promises */

chrome.debugger.attach({ tabId: chrome.devtools.inspectedWindow.tabId }, '1.3', async () => {
  const lighthouseProtocolService = new ProtocolService()
  const button = document.querySelector('#take-snapshot') as HTMLButtonElement
  const tab = await chrome.tabs.get(chrome.devtools.inspectedWindow.tabId)
  console.log('url', tab.url ?? tab.pendingUrl!)
  await lighthouseProtocolService.attach()
  button?.addEventListener('click', async () => {
    await lighthouseProtocolService.startTimespan({
      inspectedURL: tab.url ?? tab.pendingUrl!,
      categoryIDs: [],
      flags: {},
    })
    console.log('success')
  })
})
