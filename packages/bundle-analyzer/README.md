# `@perfsee/bundle-analyzer`

## Usage

```ts
import { StatsParser } from '@perfsee/bundle-analyzer'

// or const parser = StatsParser.FromStatsFile(webpackStatsFile)
const parser = StatsParser.FromStats(webpackStats, outputPath)

const { result, content } = await parser.parse()

// reference
console.log(result)

// module references tree
console.log(content)
```

## Credits

The module tree part is forked from [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
