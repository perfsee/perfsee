import { FlamechartImage, Timing } from '../..'

export const renderTimingNameTooltip = ({ timing }: { timing: Timing }) => {
  if (!timing.name) {
    return undefined
  }
  // no tooltip on label timing
  if (!timing.style || timing.style === 'label') {
    return undefined
  }
  return <div style={{ padding: '0 4px' }}>{FlamechartImage.parseStrWithImageLabel(timing.name).str}</div>
}
