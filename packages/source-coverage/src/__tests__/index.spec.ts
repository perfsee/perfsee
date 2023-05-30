import test from 'ava'

import { generateSourceCoverageTreemapData } from '..'

const testSourceContent = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = 'afwe';`

const testSourceMap = {
  version: 3,
  file: 'index.js',
  sourceRoot: '',
  sources: ['../src/index.ts'],
  names: [],
  mappings: ';;AAAA,kBAAe,MAAM,CAAA',
}

test('should match snapshot', async (t) => {
  t.snapshot(
    await generateSourceCoverageTreemapData({
      pageUrl: 'https://example.com',
      source: [
        {
          filename: 'index.js',
          content: testSourceContent,
          map: testSourceMap,
        },
      ],
      jsCoverageData: {
        'https://example.com/index.js': {
          scriptId: 'FakeId',
          url: 'https://example.com/index.js',
          functions: [
            {
              functionName: 'FakeFunctionName1',
              isBlockCoverage: false,
              ranges: [
                {
                  startOffset: 80,
                  endOffset: 90,
                  count: 0,
                },
              ],
            },
            {
              functionName: 'FakeFunctionName2',
              isBlockCoverage: false,
              ranges: [
                {
                  startOffset: 90,
                  endOffset: 100,
                  count: 1,
                },
              ],
            },
          ],
        },
      },
    }),
  )
})
