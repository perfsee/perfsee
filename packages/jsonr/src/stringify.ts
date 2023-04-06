/* eslint-disable sonarjs/no-collapsible-if */

const REF_NAME_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

function ridToHex(decimal: number) {
  let hex = ''
  if (decimal === 0) {
    return '0'
  }
  while (decimal > 0) {
    const remainder = decimal % REF_NAME_CHARS.length
    hex = REF_NAME_CHARS.charAt(remainder) + hex
    decimal = Math.floor(decimal / REF_NAME_CHARS.length)
  }
  return hex
}

export interface JSONRStringifyOptions {
  enableStringDeduplication?: boolean
}

export function* JSONRStringify(
  obj: any,
  replacer?: ((key: string, value: any) => any) | null,
  options?: JSONRStringifyOptions,
) {
  const { enableStringDeduplication = true } = options ?? {}

  let jsonr = ''
  function output(s: string) {
    jsonr += s
    if (jsonr.length > 1024 * 1024 * 100) {
      return jsonr
    }
    return null
  }
  let sidInc = 0
  const stringMap = new Map<string, { sid: string | null; rc: number }>()
  const stack: ({ v: any } | string)[] = [{ v: obj }]
  function encodeString(s: string) {
    if (!enableStringDeduplication) {
      return JSON.stringify(s)
    }
    let record = stringMap.get(s)
    if (record === undefined) {
      record = { sid: null, rc: 1 }
      stringMap.set(s, record)
    } else {
      record.rc++
    }
    if (record.sid !== null) {
      return '$' + record.sid
    } else if (s.length >= 3 && record.sid === null && (record.rc >= 2 || s.length >= 6)) {
      const newSid = ridToHex(sidInc++)
      record.sid = newSid
      return JSON.stringify(s) + '$' + newSid
    } else {
      return JSON.stringify(s)
    }
  }

  while (stack.length > 0) {
    const item = stack.pop()
    if (item === undefined) {
      break
    }
    if (typeof item === 'string') {
      if (output(item)) {
        yield jsonr
        jsonr = ''
      }
    }
    if (typeof item === 'object' && 'v' in item) {
      const obj = item.v

      // Stringify true
      if (obj === true) {
        if (output('t')) {
          yield jsonr
          jsonr = ''
        }
        continue
      }

      // Stringify false
      if (obj === false) {
        if (output('f')) {
          yield jsonr
          jsonr = ''
        }
        continue
      }

      // Stringify a null value
      if (obj === null) {
        if (output('n')) {
          yield jsonr
          jsonr = ''
        }
        continue
      }

      // Stringify a null value
      if (obj === undefined) {
        if (output('u')) {
          yield jsonr
          jsonr = ''
        }
        continue
      }

      // Stringify a primitive value
      if (typeof obj !== 'object') {
        if (typeof obj === 'string') {
          if (output(encodeString(obj))) {
            yield jsonr
            jsonr = ''
          }
        } else if (typeof obj === 'number' && Number.isNaN(obj)) {
          // Stringify NaN
          if (output('N')) {
            yield jsonr
            jsonr = ''
          }
        } else {
          if (output(obj.toString())) {
            yield jsonr
            jsonr = ''
          }
        }
        continue
      }

      // Stringify an array
      if (Array.isArray(obj)) {
        if (output('[')) {
          yield jsonr
          jsonr = ''
        }
        stack.push(']')
        for (let i = obj.length - 1; i >= 0; i--) {
          stack.push({ v: obj[i] })
          if (i !== 0) {
            stack.push(',')
          }
        }
        continue
      }

      // Stringify an object
      if (output('{')) {
        yield jsonr
        jsonr = ''
      }
      stack.push('}')
      const keys = Object.keys(obj)
      for (let i = keys.length - 1; i >= 0; i--) {
        const key = keys[i]
        let value = obj[key]
        if (typeof replacer === 'function') {
          value = replacer(key, value)
        }
        stack.push({ v: value })
        stack.push(':')
        stack.push({ v: key })
        if (i !== 0) {
          stack.push(',')
        }
      }
    }
  }
  yield jsonr
}
