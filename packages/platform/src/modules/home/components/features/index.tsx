import BundleImage from '../../assets/bundle.png'
import LabImage from '../../assets/lab.png'
import SourceImage from '../../assets/source.png'
import VSCodeImage from '../../assets/vscode.png'

import { Container, FeatureDescWrap, FeatureImageWrap, FeatureItemWrap } from './styled'

export const HomeFeatures = () => {
  return (
    <Container>
      <h1>Features</h1>

      <FeatureItemWrap>
        <FeatureImageWrap>
          <img src={BundleImage} alt="bundle" />
        </FeatureImageWrap>
        <FeatureDescWrap>
          <h2>Bundle</h2>
          <span>
            Provide plugins for main packaging tools (Webpack/Esbuild/Rollup) to collect and analyze package bundles. By
            comparing them with baseline in multiple dimensions, it will emit diff information about the bundle and its
            impact on performance, and also suggestions for how to do the optimization.
          </span>
        </FeatureDescWrap>
      </FeatureItemWrap>
      <FeatureItemWrap>
        <FeatureDescWrap>
          <h2>Lab</h2>
          <span>
            Lighthouse-based testing of first screen load performance and custom operations on test and online
            deployment environments, collecting runtime performance data and outputting recommendations for
            optimization.
          </span>
        </FeatureDescWrap>
        <FeatureImageWrap>
          <img src={LabImage} alt="lab" />
        </FeatureImageWrap>
      </FeatureItemWrap>
      <FeatureItemWrap>
        <FeatureImageWrap>
          <img src={SourceImage} alt="source" />
        </FeatureImageWrap>
        <FeatureDescWrap>
          <h2>Source</h2>
          <span>
            Based on the function calls collected from runtime analysis, secondary analysis is performed in conjunction
            with packaged products to further identify code performance bottlenecks and restore the call information to
            the source level.
          </span>
        </FeatureDescWrap>
      </FeatureItemWrap>
      <FeatureItemWrap>
        <FeatureDescWrap>
          <h2>VSCode Plugin</h2>
          <span>
            The most reliable data for performance optimization is provided in the editor in the form of Inline Hint,
            which provides a real-time view of the source code analysis results, combined with flame charts.
          </span>
        </FeatureDescWrap>
        <FeatureImageWrap>
          <img src={VSCodeImage} alt="vscode plugin" />
        </FeatureImageWrap>
      </FeatureItemWrap>
    </Container>
  )
}
