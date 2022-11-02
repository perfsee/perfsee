import {
  UserFlow as PuppeteerReplayUserFlow,
  Step as PuppeteerReplayStep,
  StepType as PuppeteerReplayStepType,
} from '@puppeteer/replay'

export type Step = Exclude<
  PuppeteerReplayStep,
  { type: PuppeteerReplayStepType.SetViewport | PuppeteerReplayStepType.EmulateNetworkConditions }
>

export interface UserFlow extends PuppeteerReplayUserFlow {
  steps: Step[]
}

export { PuppeteerReplayUserFlow, PuppeteerReplayStep }
