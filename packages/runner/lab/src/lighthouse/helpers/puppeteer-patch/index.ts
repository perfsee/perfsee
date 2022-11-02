import { registerCustomQueryHandler } from 'puppeteer-core'

import { source as injectedSource } from './puppeteer-injected'

registerCustomQueryHandler('xpath', {
  queryOne: `function (root, selector) {
    const module = {};
    ${injectedSource}
    return module.exports.default.xpathQuerySelector(root, selector)
  }` as any,
  queryAll: `function (root, selector) {
    const module = {};
    ${injectedSource}
    return module.exports.default.xpathQuerySelectorAll(root, selector)
  }` as any,
})

registerCustomQueryHandler('text', {
  queryOne: `function (root, selector) {
    const module = {};
    ${injectedSource}
    return module.exports.default.textQuerySelector(root, selector)
  }` as any,
  queryAll: `function (root, selector) {
    const module = {};
    ${injectedSource}
    return module.exports.default.textQuerySelectorAll(root, selector)
  }` as any,
})
