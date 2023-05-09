# `@perfsee/package`

[Repo](https://github.com/perfsee/perfsee) | [Docs](https://perfsee.com/docs)

Perfsee SDK to analyze packages and upload results to perfsee platform.

## Usage

### Analyze package and upload to platform

If there are benchmark files described below which named `xxx.bench.{js,ts}`(by default), this command will run benchmarks before uploading.

```bash
PERFSEE_TOKEN=<your-token> npx @perfsee/package <path-to-package> --project=<perfsee-project-id>
```

Environment `PERFSEE_TOKEN` and option `project` are necessary.

### Create benchmark file

Create a file named `test.bench.js` under the project.

```js
const Benchmark = require('@perfsee/package')

Benchmark('foo', () => {
  bar()
})

Benchmark('bar', [
  {
    test: () => {
      baz()
    },
    options: { name: 'baz' },
  },
  {
    test: async () => {
      await setup()
      return () => {
        quz()
      }
    },
    options: { name: 'quz with async setup' },
  },
])
```

All benchmark files will be run during the analysis phase (if target is not `browser`).

## CLI Options

### project

Id of your perfsee project on the platform.

### target: `'browser'` | `'node'`

#### default: `'node'`

If target is `browser`, benchmarks will be bundled and run in headless chrome on server.

### benchmarkPattern

#### default: `'*.{bench|benchmark}.{js|ts}'`

Glob pattern to find benchmark files.
