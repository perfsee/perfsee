import { Layout, Advantages, HomeBanner, HomeFeatures } from './components'

export function Home() {
  return (
    <Layout title="Perfsee" description="">
      <HomeBanner />
      <Advantages />
      <HomeFeatures />
    </Layout>
  )
}
