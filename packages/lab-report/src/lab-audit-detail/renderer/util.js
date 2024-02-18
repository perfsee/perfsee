/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/** @typedef {import('../types/lhr/audit-details').default.SnippetValue} SnippetValue */

const ELLIPSIS = '\u2026'
class Util {
  /**
   * @param {URL} parsedUrl
   * @param {{numPathParts?: number, preserveQuery?: boolean, preserveHost?: boolean}=} options
   * @return {string}
   */
  static getURLDisplayName(parsedUrl, options) {
    // Closure optional properties aren't optional in tsc, so fallback needs undefined  values.
    options = options || { numPathParts: undefined, preserveQuery: undefined, preserveHost: undefined }
    const numPathParts = options.numPathParts !== undefined ? options.numPathParts : 2
    const preserveQuery = options.preserveQuery !== undefined ? options.preserveQuery : true
    const preserveHost = options.preserveHost || false

    let name

    if (parsedUrl.protocol === 'about:' || parsedUrl.protocol === 'data:') {
      // Handle 'about:*' and 'data:*' URLs specially since they have no path.
      name = parsedUrl.href
    } else {
      name = parsedUrl.pathname
      const parts = name.split('/').filter((part) => part.length)
      if (numPathParts && parts.length > numPathParts) {
        name = ELLIPSIS + parts.slice(-1 * numPathParts).join('/')
      }

      if (preserveHost) {
        name = `${parsedUrl.host}/${name.replace(/^\//, '')}`
      }
      if (preserveQuery) {
        name = `${name}${parsedUrl.search}`
      }
    }

    const MAX_LENGTH = 64
    if (parsedUrl.protocol !== 'data:') {
      // Even non-data uris can be 10k characters long.
      name = name.slice(0, 200)
      // Always elide hexadecimal hash
      name = name.replace(/([a-f0-9]{7})[a-f0-9]{13}[a-f0-9]*/g, `$1${ELLIPSIS}`)
      // Also elide other hash-like mixed-case strings
      name = name.replace(/([a-zA-Z0-9-_]{9})(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[a-zA-Z0-9-_]{10,}/g, `$1${ELLIPSIS}`)
      // Also elide long number sequences
      name = name.replace(/(\d{3})\d{6,}/g, `$1${ELLIPSIS}`)
      // Merge any adjacent ellipses
      name = name.replace(/\u2026+/g, ELLIPSIS)

      // Elide query params first
      if (name.length > MAX_LENGTH && name.includes('?')) {
        // Try to leave the first query parameter intact
        name = name.replace(/\?([^=]*)(=)?.*/, `?$1$2${ELLIPSIS}`)

        // Remove it all if it's still too long
        if (name.length > MAX_LENGTH) {
          name = name.replace(/\?.*/, `?${ELLIPSIS}`)
        }
      }
    }

    // Elide too long names next
    if (name.length > MAX_LENGTH) {
      const dotIndex = name.lastIndexOf('.')
      if (dotIndex >= 0) {
        name =
          name.slice(0, MAX_LENGTH - 1 - (name.length - dotIndex)) +
          // Show file extension
          `${ELLIPSIS}${name.slice(dotIndex)}`
      } else {
        name = name.slice(0, MAX_LENGTH - 1) + ELLIPSIS
      }
    }

    return name
  }

  /**
   * Split a URL into a file, hostname and origin for easy display.
   * @param {string} url
   * @return {{file: string, hostname: string, origin: string}}
   */
  static parseURL(url) {
    const parsedUrl = new URL(url)
    return {
      file: Util.getURLDisplayName(parsedUrl),
      hostname: parsedUrl.hostname,
      origin: parsedUrl.origin,
    }
  }

  /**
   * Split a string by markdown code spans (enclosed in `backticks`), splitting
   * into segments that were enclosed in backticks (marked as `isCode === true`)
   * and those that outside the backticks (`isCode === false`).
   * @param {string} text
   * @return {Array<{isCode: true, text: string}|{isCode: false, text: string}>}
   */
  static splitMarkdownCodeSpans(text) {
    /** @type {Array<{isCode: true, text: string}|{isCode: false, text: string}>} */
    const segments = []

    // Split on backticked code spans.
    const parts = text.split(/`(.*?)`/g)
    for (let i = 0; i < parts.length; i++) {
      const text = parts[i]

      // Empty strings are an artifact of splitting, not meaningful.
      if (!text) continue

      // Alternates between plain text and code segments.
      const isCode = i % 2 !== 0
      segments.push({
        isCode,
        text,
      })
    }

    return segments
  }

  /**
   * Split a string on markdown links (e.g. [some link](https://...)) into
   * segments of plain text that weren't part of a link (marked as
   * `isLink === false`), and segments with text content and a URL that did make
   * up a link (marked as `isLink === true`).
   * @param {string} text
   * @return {Array<{isLink: true, text: string, linkHref: string}|{isLink: false, text: string}>}
   */
  static splitMarkdownLink(text) {
    /** @type {Array<{isLink: true, text: string, linkHref: string}|{isLink: false, text: string}>} */
    const segments = []

    const parts = text.split(/\[([^\]]+?)\]\((https?:\/\/.*?)\)/g)
    while (parts.length) {
      // Shift off the same number of elements as the pre-split and capture groups.
      const [preambleText, linkText, linkHref] = parts.splice(0, 3)

      if (preambleText) {
        // Skip empty text as it's an artifact of splitting, not meaningful.
        segments.push({
          isLink: false,
          text: preambleText,
        })
      }

      // Append link if there are any.
      if (linkText && linkHref) {
        segments.push({
          isLink: true,
          text: linkText,
          linkHref,
        })
      }
    }

    return segments
  }
}

export { Util }
