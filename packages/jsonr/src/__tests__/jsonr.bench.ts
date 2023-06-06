import { readFile } from 'fs/promises'
import path from 'path'

import Test from '@perfsee/package/benchmark'

import JSONR from '..'

Test(`Parse with test.json`, [
  {
    test: async () => {
      const file = await readFile(path.join(__dirname, './test_cases/test.json'), 'utf-8')
      return () => JSON.parse(file)
    },
    options: {
      name: `JSON.parse`,
    },
  },
  {
    test: async () => {
      const file = await readFile(path.join(__dirname, './test_cases/test.json'), 'utf-8')
      return () => JSONR.parse(file)
    },
    options: {
      name: `JSONR.parse`,
    },
  },
])

Test(`Stringify with test.json`, [
  {
    test: async () => {
      const file = await readFile(path.join(__dirname, './test_cases/test.json'), 'utf-8')
      const obj = JSON.parse(file)
      return () => JSON.stringify(obj)
    },
    options: {
      name: `JSON.stringify`,
    },
  },
  {
    test: async () => {
      const file = await readFile(path.join(__dirname, './test_cases/test.json'), 'utf-8')
      const obj = JSONR.parse(file)
      return () => JSONR.stringify(obj)
    },
    options: {
      name: `JSONR.stringify`,
    },
  },
])
