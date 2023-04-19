import { JSONRParser } from './parse'
import { JSONRStringify, JSONRStringifyOptions } from './stringify'

const JSONR = {
  stringifyStream: JSONRStringify,
  stringify: (obj: any, replacer?: ((key: string, value: any) => any) | null, options?: JSONRStringifyOptions) =>
    Array.from(JSONRStringify(obj, replacer, options)).join(''),
  parse: (jsonr: string) => new JSONRParser([jsonr]).parseValue(),
  parseStream: (jsonr: Iterable<string>) => new JSONRParser(jsonr).parseValue(),
}

export default JSONR
