# Treemap

Web tree map chart, based on webgl.

[![](https://user-images.githubusercontent.com/13579374/224657148-9125c3ba-6716-492e-afc9-72a102f4f2f7.png)](https://codesandbox.io/s/treemap-demo-4dehlh?file=/src/index.js)

[CodeSandbox Demo](https://codesandbox.io/s/treemap-demo-4dehlh?file=/src/index.js)

## Usage

```ts
import { hierarchy, TreeMap } from '@perfsee/treemap'

const treemapData = hierarchy({
  name: 'root',
  children: [
    {
      name: 'a',
      value: 30,
    },
    {
      name: 'b',
      value: 70,
    },
  ],
}).sum((d) => (d.children ? 0 : d.value || 0))

const treeMap = new TreeMap(canvasRef.current!, treemapData)
```

Notion:

- The `hierarchy()` function is re-export from `d3-hierarchy` module, you can find the document from [here](https://github.com/d3/d3-hierarchy).
