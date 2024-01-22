/**
 * This is the only file you need to modify
 */

import { Audit, BundleAuditScore } from '@perfsee/bundle-analyzer'

const exampleAudit: Audit = ({ chunks }) => {
  const initialAssets = new Set(
    chunks
      .filter((chunk) => !chunk.async)
      .map((chunk) => chunk.assets.map((asset) => asset.name))
      .flat(),
  )

  return {
    id: 'http2-notice',
    title: 'Use HTTP/2',
    desc: 'HTTP/2 offers many benefits over HTTP/1.1, including binary headers, multiplexing, and server push.',
    link: 'https://http2.github.io/faq/',
    score: initialAssets.size <= 6 ? BundleAuditScore.Good : BundleAuditScore.Notice,
    weight: 0,
  }
}

// Keep default export
export default exampleAudit
