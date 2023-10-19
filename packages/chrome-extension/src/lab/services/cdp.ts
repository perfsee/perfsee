import { ParallelConnection } from './connection'

export class CDPConnection extends ParallelConnection {
  async sendRawMessage(message: string): Promise<void> {
    const { method, params, id } = JSON.parse(message)
    const debugee = { tabId: chrome.devtools.inspectedWindow.tabId }
    try {
      if (method === 'Browser.getVersion') {
        return window.connection.onMessage({
          id,
          result: {
            protocolVersion: '1.3',
            product: 'chrome',
            revision: '118.0.5993.117',
            userAgent:
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
            jsVersion: '9.9',
          },
        })
      }
      const result = await chrome.debugger.sendCommand(debugee, method, params)
      console.log(`${method} real result!!`, result)
      window.connection.onMessage({ id, result })
    } catch (e) {
      console.error('error', e)
      window.connection.onMessage({ id, result: {} })
    }
  }
}
