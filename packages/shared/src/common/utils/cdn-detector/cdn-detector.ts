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

import { CDNDetectorHeaders, CDNDetectorHostname, CDNDetectorMultiHeaders } from './data'
import { ProvidersHostname } from './data/provider'

type Result = {
  cdn: string
  evidence: {
    hostname?: string
    headers?: string[]
  }
}

/**
 * Detects CDN usage from a hostname.
 * @param hostname hostname
 */
const detectFromHostname = (hostname?: string) => {
  if (!hostname) {
    return null
  }

  for (const regexStr of Object.keys(CDNDetectorHostname)) {
    const regex = new RegExp(regexStr)
    if (regex.test(hostname)) {
      return {
        cdn: CDNDetectorHostname[regexStr],
        evidence: regexStr,
      }
    }
  }

  return null
}

/**
 * @param headers headers HTTP Response Headers map
 */
const detectFromHeaders = (headers?: Record<string, string>) => {
  if (!headers || !Object.keys(headers).length) {
    return null
  }

  // build return evidence object in case we find something
  let result = {
    evidence: [] as string[],
    cdn: '',
  }

  // convert all incoming headers to lower case first
  const lowerHeaders = {}
  for (const headerName of Object.keys(headers)) {
    lowerHeaders[headerName.toLowerCase()] = headers[headerName].toLowerCase()
  }

  // find any matching headers in our data
  for (const data of CDNDetectorHeaders) {
    const [header, match, cdn] = data

    if (lowerHeaders[header] && (!match?.length || (match.length > 0 && lowerHeaders[header].indexOf(match) === 0))) {
      // if there is no match string, we're good
      // if there a match string, make sure the header starts with it

      result = {
        cdn,
        evidence: [...result.evidence, header + ': ' + (match ? match : '*')],
      }
    }
  }

  // find any multi headers (multiple headers need to match)
  for (const data of CDNDetectorMultiHeaders) {
    const [cdn, matches] = data as [string, Record<string, string>]

    let matchesAll = true
    const matchEvidence = []

    // loop through, looking to see if this request matches
    // all headers in the set
    for (const match of Object.keys(matches)) {
      const matchValue = matches[match]

      if (typeof lowerHeaders[match] !== 'string') {
        matchesAll = false
        break
      }

      if (lowerHeaders[match].indexOf(matchValue) === -1) {
        matchesAll = false
        break
      }

      // add to our evidence pile
      matchEvidence.push(match + ': ' + (matchValue ? matchValue : '*'))
    }

    // we matched all headers
    if (matchesAll) {
      result = {
        cdn,
        evidence: result.evidence.concat(matchEvidence),
      }
    }
  }

  return result.cdn ? result : null
}

/**
 * @param hostname hostname
 * @param headers headers map of HTTP Response headers
 */
export const detectCDN = (hostname?: string, headers?: Record<string, string>) => {
  let result = {} as Result
  // check hostname first
  const hostnameCheck = detectFromHostname(hostname)
  if (hostnameCheck) {
    result = {
      cdn: hostnameCheck.cdn,
      evidence: {
        ...(result.evidence ?? {}),
        hostname: hostnameCheck.evidence,
      },
    }
  }

  // check HTTP response headers next
  const headersCheck = detectFromHeaders(headers)
  if (headersCheck) {
    result = {
      cdn: headersCheck.cdn,
      evidence: {
        ...(result.evidence ?? {}),
        headers: headersCheck.evidence,
      },
    }
  }

  return result.cdn ? result : null
}

export const detectThirdPartyProvider = (hostname?: string) => {
  if (!hostname) {
    return undefined
  }
  for (const regexStr of Object.keys(ProvidersHostname)) {
    const regex = new RegExp(regexStr)
    if (regex.test(hostname)) {
      return {
        name: ProvidersHostname[regexStr].name as string,
        type: ProvidersHostname[regexStr].type as string,
        evidence: regexStr,
      }
    }
  }
}
