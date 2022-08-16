import Comparison from '@site/assets/pages/lab-comparison.png'
import Scores from '@site/assets/pages/lab-scores.png'
import Timeline from '@site/assets/pages/lab-timeline.png'
import Treemap from '@site/assets/pages/lab-treemap.png'
import React from 'react'

import { Layout, FeatureBanner, FeatureCard } from '../../components'

const FeaturesLab = () => {
  return (
    <Layout title="Perfsee" description="">
      <FeatureBanner
        title="Lab"
        description="Lighthouse-based testing of first screen load performance and custom operations on test and online
        deployment environments, collecting runtime performance data and outputting recommendations for
        optimization."
      />
      <div>
        <FeatureCard
          title="Fully integrated with Lighthouse"
          description="Portions of lab report use Lighthouse. "
          img={Scores}
        />
        <FeatureCard
          title="Main Thread Execution Timeline"
          description="With the Main Thread Execution Timeline, it’s possible to pinpoint long-running and blocking JavaScript tasks."
          img={Timeline}
          reverse
        />
        <FeatureCard
          title="JavaScript code coverage"
          description="The visualization shows the JavaScript coverage on the page during runtime. The red shaded parts of the graph are the JavaScript that was downloaded but not run."
          img={Treemap}
        />
        <FeatureCard
          title="Compare multiple reports"
          description="When you want to compare the critical metrics changes of the same page over several time periods, you can select 2 to 5 reports in the list page of Lab."
          img={Comparison}
          reverse
        />
      </div>
    </Layout>
  )
}

export default FeaturesLab
