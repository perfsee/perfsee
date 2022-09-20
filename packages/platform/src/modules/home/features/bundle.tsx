import Baseline from '../assets/bundle-baseline.png'
import DuplicatePackages from '../assets/bundle-duplicate-packages.png'
import Score from '../assets/bundle-score.png'
import Visualization from '../assets/bundle-visualization.png'
import { Layout, FeatureBanner, FeatureCard } from '../components'

const FeaturesBundle = () => {
  return (
    <Layout title="Perfsee" description="">
      <FeatureBanner
        title="Bundle"
        description="Provide plugins for main packaging tools (Webpack/Esbuild/Rollup) to collect and analyze package artifacts.
        Detailed comparison information is given for files, third party dependencies etc. based on historical
        benchmark versions. Also analyses the product structure in detail and outputs suggestions for optimization."
      />
      <div>
        <FeatureCard
          title="Intuitive Score"
          description="We calculated the artifact's score through audit rules. You can directly see the performance level with the score."
          img={Score}
        />
        <FeatureCard
          title="Baseline Comparison"
          description="Each artifact report will be compared with the baseline artifact report. Difference with the baseline artifact report will be displayed obviously."
          img={Baseline}
          reverse
        />
        <FeatureCard
          title="Content Visualization"
          description="We provided a visualization graph like WebpackBundleAnalyzer do, so you can know module references of your project better."
          img={Visualization}
        />
        <FeatureCard
          title="Duplicate Packages"
          description="Normally, bundle tools won't pack the same package more than once into final js, buf if some of your dependencies import different version of other dependencies, you may encounter this situation."
          img={DuplicatePackages}
          reverse
        />
      </div>
    </Layout>
  )
}

export default FeaturesBundle
