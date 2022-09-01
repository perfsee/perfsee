import Flamechart from '@site/assets/pages/source-flamechart.png'
import Path from '@site/assets/pages/source-path.png'
import VSCode from '@site/assets/pages/vscode.png'
import React from 'react'

import { Layout, FeatureBanner, FeatureCard } from '../../components'

const FeaturesSource = () => {
  return (
    <Layout title="Perfsee" description="">
      <FeatureBanner
        title="Source"
        description="Based on the function calls collected from runtime analysis, secondary analysis is performed in conjunction
        with packaged products to further identify code performance bottlenecks and restore the call information to
        the source level."
      />
      <div>
        <FeatureCard
          title="Flamechart"
          description="We record the browser profile data and then draw the flame chart to show the real call stack of the page."
          img={Flamechart}
        />
        <FeatureCard
          title="Reductio to real source path"
          description="We reductio all the call stack information in the flame chart to the real source paths and function names, to improve the readability of the flame chart and make it easier for developers to understand the call chain"
          img={Path}
          reverse
        />
        <FeatureCard
          title="VSCode plugin"
          description="Display source report data in VSCode, you can see real function execution time in the inline hint."
          img={VSCode}
        />
      </div>
    </Layout>
  )
}

export default FeaturesSource
