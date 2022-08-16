import React from 'react'

import { Layout, Advantages, HomeBanner, HomeFeatures } from '../components'

export default function Hello() {
  return (
    <Layout title="Perfsee" description="">
      <HomeBanner />
      <Advantages />
      <HomeFeatures />
    </Layout>
  )
}
