import test from 'ava'

import { parseAssetModules, parseModuleRequiredChunks } from '../stats-parser/asset-parser/asset-parser-webpack'

const fixtureModules = [1, '2', 'abc']

test('should correct parse inline modules correctly', (t) => {
  const modules = parseAssetModules(`exports.modules={1:() =>{},'2':()=>{},'abc':function(){},}`)
  t.deepEqual(Array.from(modules.keys()), fixtureModules)
})

test('should parse main chunk with inline modules correctly', (t) => {
  const anonymousFunctionModules = parseAssetModules(
    `!function(){var t={1:function(){},'2': function(){},'abc':function(){}},r={};function o(){}}()`,
  )
  const arrowFunctionModules = parseAssetModules(
    `(()=>{var t={1:()=>{},'2':()=>{},'abc':()=>{}},r={};function o(){}})()`,
  )
  t.deepEqual(Array.from(anonymousFunctionModules.keys()), fixtureModules)
  t.deepEqual(Array.from(arrowFunctionModules.keys()), fixtureModules)
})

test('should parse main chunk with argument modules correctly', (t) => {
  const anonymousFunctionModules = parseAssetModules(
    `(function(m){})({1:function(){},'2':function(){},'abc':function(){}})`,
  )

  t.deepEqual(Array.from(anonymousFunctionModules.keys()), fixtureModules)
})

test('should parse async modules (webpack < v4)', (t) => {
  const anonymousFunctionModules = parseAssetModules(
    `webpackJsonp([1], {1:function(){},'2':function(){},'abc':function(){}})`,
  )

  t.deepEqual(Array.from(anonymousFunctionModules.keys()), fixtureModules)
})

test('should parse async modules (webpack > v4)', (t) => {
  const anonymousFunctionModules = parseAssetModules(
    `(self.webpackJsonp=self.webpackJsonp||[]).push([[1], {1:function(){},'2':function(){},'abc':function(){}}])`,
  )

  t.deepEqual(Array.from(anonymousFunctionModules.keys()), fixtureModules)
})

test('should parse async modules var a=(webpack > v4)', (t) => {
  const anonymousFunctionModules = parseAssetModules(
    `a=(self.webpackJsonp=self.webpackJsonp||[]).push([[1], {1:function(){},'2':function(){},'abc':function(){}}])`,
  )

  t.deepEqual(Array.from(anonymousFunctionModules.keys()), fixtureModules)
})

test('should parse async modules (rspack)', (t) => {
  const anonymousFunctionModules = parseAssetModules(
    `;(() => { var a = 3;(globalThis.webpackChunkunion_admin = globalThis.webpackChunkunion_admin || []).push([[1], {1:function(){},'2':function(){},'abc':function(){}}])})()`,
  )

  t.deepEqual(Array.from(anonymousFunctionModules.keys()), fixtureModules)
})

test('should parse moudle required chunks', (t) => {
  const requiredChunks = parseModuleRequiredChunks(
    `(a,b,c) => {var r=c(3307);var O=react.lazy(() => c.e(549).then(c__.bind(c, 3607)));}`,
  )
  t.deepEqual(requiredChunks, [549])
})

test('should parse moudle required chunks 2', (t) => {
  const requiredChunks = parseModuleRequiredChunks(`(a,b,c) => {var r=c(3307);c.O(0, [96], () => (c(4592)));}`)
  t.deepEqual(requiredChunks, [96])
})
