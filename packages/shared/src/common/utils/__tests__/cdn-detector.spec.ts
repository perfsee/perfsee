import test from 'ava'

import { detectCDN } from '../cdn-detector'

test('should return Akamai for akamai.net', (t) => {
  const result = detectCDN('www.akamai.net')
  t.not(result, null)
  t.is(result!.cdn, 'Akamai')
})

test('should return Cloudflare for xxx.com with Server: cloudflare', (t) => {
  const result = detectCDN('xxx.com', {
    Server: 'cloudflare',
  })
  t.not(result, null)
  t.is(result!.cdn, 'Cloudflare')
})

test('should return AliYun for xxx.com with header', (t) => {
  const result = detectCDN('xxx.com', {
    'server-timing': 'inner; dur=0, inner; dur=12, cdn-cache;desc=HIT,edge;dur=1',
    server: 'Tengine',
  })
  t.not(result, null)
  t.is(result!.cdn, 'AliYun')
})

test('should return AliYun for xxx.com with server: tengine', (t) => {
  const result = detectCDN('xxx.com', {
    'server-timing': 'cdn-cache;desc=HIT,edge;dur=1',
    server: 'tengine',
  })
  t.not(result, null)
  t.is(result!.cdn, 'AliYun')
})
