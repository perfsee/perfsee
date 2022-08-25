# Treemap

Web tree map chart, based on webgl.

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
