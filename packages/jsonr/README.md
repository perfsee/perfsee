## jsonr

JSON with references

# Example

```
import JSONR from '@perfsee/jsonr'

const jsonrStr = JSONR.stringify({ hello: "world" })
const obj = JSONR.parse(jsonrStr)
```

# Format

```JS
const obj = { a: { hello: 'world', foooobar: 1 }, b: [] as any[] }
obj.b.push(obj.a, obj.a, obj.a)

const jsonrStr = JSONR.stringify(obj)

jsonrStr ->

{
  "a": {
    "hello": "world",
    "foooobar"$0: 1
  },
  "b": [
    {
      "hello"$1: "world"$2,
      $0: 1
    },
    {
      $1:$2,
      $0: 1
    },
    {
      $1:$2,
      $0: 1
    }
  ]
}
```
