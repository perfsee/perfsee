/*eslint no-constant-condition: ["error", { "checkLoops": false }]*/

const N_FIRST_CHARS = '-0123456789.'
const N_CHARS = '-0123456789.eE+'
const REF_NAME_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

export class JSONRParser {
  private i = 0
  private readonly totalLength
  private readonly jsonr: string[] = []
  private readonly refMap: Map<string, any> = new Map()
  constructor(jsonr: Iterable<string>) {
    this.jsonr = Array.from(jsonr)
    this.totalLength = this.jsonr.reduce((p, s) => p + s.length, 0)
    this.skipWhiteSpace()
  }

  nextChar() {
    if (this.i >= this.totalLength) {
      this.throwHere()
    }
    const char = this.lookNextChar()
    this.i++
    return char
  }

  lookNextChar() {
    let ci = this.i
    let cx = 0
    while (true) {
      if (this.jsonr[cx].length <= ci) {
        ci -= this.jsonr[cx].length
        cx++
        if (cx === this.jsonr.length) {
          return ''
        }
      } else {
        return this.jsonr[cx].charAt(ci)
      }
    }
  }

  substring(start: number, end: number) {
    if (end < start) {
      throw new Error('end should bigger then start')
    }
    let cx = 0
    while (true) {
      if (this.jsonr[cx].length <= start) {
        start -= this.jsonr[cx].length
        end -= this.jsonr[cx].length
        cx++
      } else {
        break
      }
    }
    let result = ''
    while (true) {
      result += this.jsonr[cx].substring(Math.max(start, 0), Math.max(end, 0))
      if (this.jsonr[cx].length < end) {
        start -= this.jsonr[cx].length
        end -= this.jsonr[cx].length
        cx++
      } else {
        break
      }
    }
    return result
  }

  isWhiteSpace(c: string) {
    return c === ' ' || c === '\r' || c === '\n' || c === '\t'
  }

  skipWhiteSpace() {
    while (this.isWhiteSpace(this.lookNextChar())) this.nextChar()
  }

  parseValue() {
    const c = this.lookNextChar()
    let v
    if (c === '{') {
      v = this.parseObject()
    } else if (c === '[') {
      v = this.parseArray()
    } else if (c === '"') {
      v = this.parseString()
    } else if (N_FIRST_CHARS.includes(c)) {
      v = this.parseNumber()
    } else if (c === 't') {
      v = this.parseLiteral('true', true)
    } else if (c === 'f') {
      v = this.parseLiteral('false', false)
    } else if (c === 'n') {
      v = this.parseLiteral('null', null)
    } else if (c === 'N') {
      v = this.parseLiteral('NaN', NaN)
    } else if (c === 'u') {
      v = this.parseLiteral('undefined', undefined)
    } else if (c === '$') {
      v = this.parseRef()
    } else {
      this.throwHere()
    }

    this.skipWhiteSpace()
    if (this.lookNextChar() === '$') {
      this.nextChar()
      const refStartIndex = this.i
      while (REF_NAME_CHARS.includes(this.lookNextChar().toUpperCase())) {
        this.nextChar()
      }
      const refEndIndex = this.i
      const refName = this.substring(refStartIndex, refEndIndex).trim()
      this.refMap.set(refName, v)
    }

    return v
  }

  parseObject() {
    // {"a": "b"}
    this.nextChar()
    this.skipWhiteSpace()
    if (this.lookNextChar() === '}') {
      this.nextChar()
      return {}
    }
    const o = {}
    while (true) {
      const key = this.parseValue()
      this.skipWhiteSpace()
      if (this.nextChar() !== ':') this.throwHere()
      this.skipWhiteSpace()
      const value = this.parseValue()
      o[key] = value
      this.skipWhiteSpace()
      if (this.lookNextChar() === ',') {
        this.nextChar()
        this.skipWhiteSpace()
      } else {
        break
      }
    }
    if (this.nextChar() !== '}') {
      this.throwHere()
    }
    return o
  }
  parseArray() {
    // [1,2,3]
    this.nextChar()
    this.skipWhiteSpace()
    if (this.lookNextChar() === ']') {
      this.nextChar()
      return []
    }
    const a: any[] = []
    while (true) {
      const value = this.parseValue()
      a.push(value)
      this.skipWhiteSpace()
      if (this.lookNextChar() === ',') {
        this.nextChar()
        this.skipWhiteSpace()
      } else {
        break
      }
    }
    if (this.nextChar() !== ']') {
      this.throwHere()
    }
    return a
  }
  parseString() {
    // use native json parse
    const startIndex = this.i
    this.nextChar()
    while (true) {
      const c = this.nextChar()
      if (c === '"') {
        break
      }
      if (c === '\\') {
        this.nextChar()
      }
    }
    const endIndex = this.i
    return JSON.parse(this.substring(startIndex, endIndex))
  }
  parseNumber() {
    const startIndex = this.i
    this.nextChar()
    while (this.lookNextChar() !== '' && N_CHARS.includes(this.lookNextChar())) {
      this.nextChar()
    }
    const endIndex = this.i
    return new Number(this.substring(startIndex, endIndex)).valueOf()
  }

  parseLiteral(literal: string, v: any): any {
    for (let i = 0; i < literal.length; i++) {
      if (literal.charAt(i) !== this.lookNextChar()) {
        return v
      }
      this.nextChar()
    }
    return v
  }

  parseRef() {
    this.nextChar()
    const nameStartIndex = this.i
    while (REF_NAME_CHARS.includes(this.lookNextChar().toUpperCase())) {
      this.nextChar()
    }
    const nameEndIndex = this.i
    const name = this.substring(nameStartIndex, nameEndIndex).trim()
    if (this.refMap.has(name)) {
      return this.refMap.get(name)
    } else {
      this.throwHere()
    }
  }
  throwHere() {
    throw new Error('Invalid json, read "' + this.substring(this.i - 5, this.i) + '"')
  }
}
