import { type Protocol, type ConnectionTransport } from 'puppeteer-core'
import { CdpBrowser } from 'puppeteer-core/lib/esm/puppeteer/cdp/Browser.js'
import { CdpCDPSession } from 'puppeteer-core/lib/esm/puppeteer/cdp/CDPSession.js'
import { Connection } from 'puppeteer-core/lib/esm/puppeteer/cdp/Connection.js'
import { CdpElementHandle } from 'puppeteer-core/lib/esm/puppeteer/cdp/ElementHandle.js'
import { CdpFrame } from 'puppeteer-core/lib/esm/puppeteer/cdp/Frame.js'
import { CdpPage } from 'puppeteer-core/lib/esm/puppeteer/cdp/Page.js'
import { CdpTarget } from 'puppeteer-core/lib/esm/puppeteer/cdp/Target.js'

export {
  CdpBrowser as Browser,
  CdpTarget as Target,
  Connection,
  ConnectionTransport,
  CdpElementHandle as ElementHandle,
  CdpFrame as Frame,
  CdpPage as Page,
  Protocol,
  CdpCDPSession as CDPSession,
}
