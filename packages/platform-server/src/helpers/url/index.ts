import { Injectable } from '@nestjs/common'
import { Response } from 'express'
import { StringifiableRecord, stringifyUrl } from 'query-string'

import { Config } from '@perfsee/platform-server/config'

@Injectable()
export class UrlService {
  redirectAllowHosts: string[]

  constructor(private readonly config: Config) {
    this.redirectAllowHosts = [this.config.baseUrl]
    if (process.env.NODE_ENV === 'development') {
      this.redirectAllowHosts.push('http://localhost:8080')
    }
  }

  platformUrl(pathFactory: (param?: undefined) => string, data?: undefined, query?: StringifiableRecord): string
  platformUrl<T>(pathFactory: (param: T) => string, data: T, query?: StringifiableRecord): string
  platformUrl<T>(pathFactory: (param: T) => string, data: T, query?: StringifiableRecord) {
    const path = pathFactory.call(null, data)

    // the `/sub-path` segment should be added in path factory, so we only need to append `origin` here
    return stringifyUrl({ url: this.config.origin + path, query })
  }

  safeRedirect(res: Response, to: string) {
    const finalTo = new URL(to, this.config.baseUrl)
    for (const host of this.redirectAllowHosts) {
      const hostURL = new URL(host)
      if (hostURL.origin === finalTo.origin && finalTo.pathname.startsWith(hostURL.pathname)) {
        res.redirect(finalTo.href.substring(finalTo.origin.length))
        return
      }
    }

    return res.redirect(this.config.path || '/')
  }
}
