import { JobWorker } from '../worker'

export class FakeWorker extends JobWorker<any> {
  doWork() {
    return new Promise((resolve) => {
      setTimeout(resolve, 4000)
    })
  }

  protected before() {
    this.logger.info('FakeWorker:before')
    return Promise.resolve()
  }

  protected async work() {
    this.logger.info('FakeWorker:work')
    await this.doWork()
  }

  protected after() {
    this.logger.info('FakeWorker:after')
    return Promise.resolve()
  }

  protected onError(_error: Error): void {}
}
