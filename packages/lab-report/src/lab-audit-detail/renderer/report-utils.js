/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

class ReportUtils {
  /**
   * Returns a comparator created from the supplied list of keys
   * @param {Array<string>} sortedBy
   * @return {((a: LH.Audit.Details.TableItem, b: LH.Audit.Details.TableItem) => number)}
   */
  static getTableItemSortComparator(sortedBy) {
    return (a, b) => {
      for (const key of sortedBy) {
        const aVal = a[key]
        const bVal = b[key]
        if (typeof aVal !== typeof bVal || !['number', 'string'].includes(typeof aVal)) {
          console.warn(`Warning: Attempting to sort unsupported value type: ${key}.`)
        }
        if (typeof aVal === 'number' && typeof bVal === 'number' && aVal !== bVal) {
          return bVal - aVal
        }
        if (typeof aVal === 'string' && typeof bVal === 'string' && aVal !== bVal) {
          return aVal.localeCompare(bVal)
        }
      }
      return 0
    }
  }
}

export { ReportUtils }
