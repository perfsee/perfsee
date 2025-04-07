const MAX_DEPTH = 5

export function serializeBundlerOptions(options: any) {
  const processed = new WeakMap()

  function serialize(value: any, depth = 0, path = ''): any {
    if (value === null || value === undefined) {
      return value
    }

    if (typeof value !== 'object' && typeof value !== 'function') {
      return value
    }

    if (depth > MAX_DEPTH) {
      return `[depth limit exceeded]`
    }

    if (processed.has(value)) {
      return '[circular reference]'
    }

    if (typeof value === 'function') {
      const fnResult = {
        __type: 'Function',
        name: value.name || '(anonymous)',
        source: undefined,
      }

      try {
        fnResult.source = value.toString()
      } catch (e) {
        //
      }

      return fnResult
    }

    if (value instanceof RegExp) {
      return {
        __type: 'RegExp',
        pattern: value.toString(),
      }
    }

    if (value instanceof Date) {
      return {
        __type: 'Date',
        value: value.toISOString(),
      }
    }

    if (value instanceof Set) {
      return {
        __type: 'Set',
        values: Array.from(value).map((v, i) => serialize(v, depth + 1, `${path}[${i}]`)),
      }
    }

    if (value instanceof Map) {
      return {
        __type: 'Map',
        entries: Array.from(value.entries()).map(([k, v], i) => ({
          key: serialize(k, depth + 1, `${path}.key[${i}]`),
          value: serialize(v, depth + 1, `${path}.value[${i}]`),
        })),
      }
    }

    processed.set(value, true)

    if (Array.isArray(value)) {
      const result = value.map((item, index) => serialize(item, depth + 1, `${path}[${index}]`))

      processed.delete(value)

      return result
    }

    const result = {}

    for (const key of Object.keys(value)) {
      try {
        result[key] = serialize(value[key], depth + 1, path ? `${path}.${key}` : key)
      } catch (error: any) {
        result[key] = `[failed to serialize: ${error.message}]`
      }
    }

    processed.delete(value)

    return result
  }

  try {
    return serialize(options)
  } catch {
    return undefined
  }
}
