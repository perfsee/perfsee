# source-coverage

Applying sourcemap to js coverage data.

## Example:

```js
import { generateSourceCoverageTreemapData } from '@perfsee/source-coverage'

generateSourceCoverageTreemapData({
  pageUrl: 'https://example.com',
  source: [...],
  jsCoverageData: {...}
})
```
