/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { Parser } from 'htmlparser2'

import { AssetTypeEnum, BundleAuditScore, Audit } from '../../types'
import { getDomain } from '../utils'

export const preconnect: Audit = ({ assets }) => {
  const preconnects = new Set<string>()
  const links = new Set<string>()

  const parser = new Parser({
    onopentag(tag, attrs) {
      if (tag === 'link') {
        if (attrs['rel'] === 'preconnect' || attrs['rel'] === 'dns-prefetch') {
          preconnects.add(getDomain(attrs['href']))
        } else if (attrs['rel'] === 'stylesheet') {
          links.add(getDomain(attrs['href']))
        }
      } else if (tag === 'script' && attrs['src']) {
        links.add(getDomain(attrs['src']))
      }
    },
  })

  try {
    for (const asset of assets) {
      if (asset.type !== AssetTypeEnum.Html || !asset.content) {
        continue
      }

      parser.write(asset.content)
    }
    parser.end()
  } catch (e) {
    console.error(e)
  }

  const miss = Array.from(links).filter((link) => link !== 'noop' && !preconnects.has(link))

  return {
    id: 'pre-connect-origin',
    title: 'Improve page load speed with `preconnect` or `dns-prefetch`',
    desc: `Establishing connections often involves significant time in slow networks, particularly when it comes
 to secure connections, as it may involve DNS lookups, redirects, and several round trips to the final
 server that handles the user's request.`,
    detail: {
      type: 'list',
      items: miss,
    },
    link: 'https://web.dev/uses-rel-preconnect/',
    score: miss.length ? BundleAuditScore.Bad : BundleAuditScore.Good,
    numericScore: {
      value: miss.length ? 0 : 1,
      absoluteWarningThrottle: 1,
    },
    weight: 5,
  }
}
