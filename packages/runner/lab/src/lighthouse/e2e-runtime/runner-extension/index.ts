import { AssertedEventType, PuppeteerRunnerExtension, Step, StepType, UserFlow } from '@puppeteer/replay'
// @ts-expect-error Lighthouse doesn't expose types.
import { startFlow } from 'lighthouse/lighthouse-core/fraggle-rock/api.js'
import { Browser, Page } from 'puppeteer-core'

import { logger } from '@perfsee/job-runner-shared'

export class LighthouseRunnerExtension extends PuppeteerRunnerExtension {
  private isTimespanRunning = false
  private isNavigationRunning = false
  private lhFlow?: any
  private currentNavigation?: { continueAndAwaitResult: () => Promise<void> }

  constructor(
    browser: Browser,
    page: Page,
    opts: {
      timeout?: number
    },
    private readonly lighthouseOptions: any,
  ) {
    super(browser, page, opts)
  }

  createFlowResult(): Promise<LH.FlowResult> {
    if (!this.lhFlow) {
      throw new Error('Cannot get flow result before running the flow')
    }
    return this.lhFlow.createFlowResult()
  }

  createArtifactsJson(): LH.UserFlow.FlowArtifacts {
    return this.lhFlow.createArtifactsJson()
  }

  override async beforeAllSteps(flow: UserFlow) {
    await super.beforeAllSteps?.(flow)

    this.lhFlow = await startFlow(this.page, {
      config: this.lighthouseOptions.config,
      name: flow.title,
    })
  }

  override async beforeEachStep(step: Step, flow?: UserFlow) {
    await super.beforeEachStep?.(step, flow)
    if (
      step.type === StepType.SetViewport ||
      step.type === StepType.EmulateNetworkConditions ||
      step.type === StepType.Close ||
      step.type === StepType.CustomStep
    )
      return

    if (step.type === StepType.WaitForElement || step.type === StepType.WaitForExpression) {
      return
    } else {
      if (this.isNavigationRunning) {
        await wait(1000)
        await this.page.bringToFront()
        await this.endNavigation()
        logger.info('end navigation')
        this.isNavigationRunning = false
      }
      if (this.isTimespanRunning) {
        await wait(1000)
        await this.page.bringToFront()
        await this.lhFlow.endTimespan()
        logger.info('end timespan')
        this.isTimespanRunning = false
      }

      if (isNavigationStep(step)) {
        await this.startNavigation()
        logger.info('start navigation')
        this.isNavigationRunning = true
      } else {
        await this.lhFlow.startTimespan()
        logger.info('start timespan')
        this.isTimespanRunning = true
      }
    }
  }

  override async afterEachStep(step: Step, flow?: UserFlow) {
    await super.afterEachStep?.(step, flow)
  }

  override async afterAllSteps(flow: UserFlow) {
    if (this.isNavigationRunning) {
      await wait(1000)
      await this.page.bringToFront()
      await this.endNavigation()
      logger.info('end navigation')
      this.isNavigationRunning = false
    }
    if (this.isTimespanRunning) {
      await wait(1000)
      await this.page.bringToFront()
      await this.lhFlow.endTimespan()
      logger.info('end timespan')
      this.isTimespanRunning = false
    }
    await super.afterAllSteps?.(flow)
  }

  /**
   * This is an alternative to `navigate()` that can be used to analyze a navigation triggered by user interaction.
   * copy from https://github.com/GoogleChrome/lighthouse/blob/60c2fa25d11187802e905e4f335b2e7f6df735f1/core/user-flow.js#L139
   */
  async startNavigation(stepOptions?: any) {
    let completeSetup: (value: () => void) => void
    let rejectDuringSetup: (value: any) => void

    // This promise will resolve once the setup is done
    // and Lighthouse is waiting for a page navigation to be triggered.
    const navigationSetupPromise = new Promise<() => void>((resolve, reject) => {
      completeSetup = resolve
      rejectDuringSetup = reject
    })

    // The promise in this callback will not resolve until `continueNavigation` is invoked,
    // because `continueNavigation` is passed along to `navigateSetupPromise`
    // and extracted into `continueAndAwaitResult` below.
    const navigationResultPromise = this.lhFlow
      .navigate(() => new Promise<void>((continueNavigation) => completeSetup(continueNavigation)), stepOptions)
      .catch((err: any) => {
        if (this.currentNavigation) {
          // If the navigation already started, re-throw the error so it is emitted when `navigationResultPromise` is awaited.
          throw err
        } else {
          // If the navigation has not started, reject the `navigationSetupPromise` so the error throws when it is awaited in `startNavigation`.
          rejectDuringSetup(err)
        }
      })

    const continueNavigation = await navigationSetupPromise

    async function continueAndAwaitResult() {
      continueNavigation()
      await navigationResultPromise
    }

    this.currentNavigation = { continueAndAwaitResult }
  }

  async endNavigation() {
    if (!this.currentNavigation) throw new Error('No navigation in progress')
    await this.currentNavigation.continueAndAwaitResult()
    this.currentNavigation = undefined
  }
}

export function isNavigationStep(step: Step): boolean {
  return Boolean(
    step.type === StepType.Navigate ||
      step.assertedEvents?.some((event) => event.type === AssertedEventType.Navigation),
  )
}

function wait(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}
