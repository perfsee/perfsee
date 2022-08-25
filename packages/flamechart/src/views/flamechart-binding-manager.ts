export type FlamechartBindingCallback = (x: number, size: number) => void

export class FlamechartBindingManager {
  private readonly listeners: Set<FlamechartBindingCallback> = new Set()

  addListener(listener: FlamechartBindingCallback) {
    this.listeners.add(listener)
  }

  removeListener(listener: FlamechartBindingCallback) {
    this.listeners.delete(listener)
  }

  notify(x: number, size: number) {
    this.listeners.forEach((listener) => listener(x, size))
  }
}
