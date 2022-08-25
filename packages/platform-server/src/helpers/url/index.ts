import { Injectable } from '@nestjs/common'
import { Response } from 'express'
import { StringifiableRecord, stringifyUrl } from 'query-string'

import { Config } from '@perfsee/platform-server/config'

interface ProjectRouteParam {
  projectId: string
}

@Injectable()
export class UrlService {
  redirectAllowHosts: string[]

  constructor(private readonly config: Config) {
    this.redirectAllowHosts = [this.config.host + this.config.path]
    if (process.env.NODE_ENV === 'development') {
      this.redirectAllowHosts.push('http://localhost:8080')
    }
  }

  projectUrl<T>(
    pathFactory: (param: T & ProjectRouteParam) => string,
    data: T & ProjectRouteParam,
    query?: StringifiableRecord,
  ) {
    const path = pathFactory.call(null, { ...data })

    return stringifyUrl({ url: this.config.host + path, query })
  }

  platformUrl(pathFactory: (param?: undefined) => string, data?: undefined, query?: StringifiableRecord): string
  platformUrl<T>(pathFactory: (param: T) => string, data: T, query?: StringifiableRecord) {
    const path = pathFactory.call(null, data)

    return stringifyUrl({ url: this.config.host + path, query })
  }

  safeRedirect(res: Response, to: string) {
    if (!to) {
      res.redirect(this.config.path || '/')
    } else {
      const finalTo = new URL(to, this.config.host).href
      for (const host of this.redirectAllowHosts) {
        if (finalTo.startsWith(host)) {
          if (finalTo.startsWith(this.config.host)) {
            res.redirect(finalTo.substring(this.config.host.length))
            return
          } else {
            res.redirect(finalTo)
            return
          }
        }
      }
      res.redirect(this.config.path || '/')
    }
  }
}
