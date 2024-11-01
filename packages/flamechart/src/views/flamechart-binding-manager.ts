export type FlamechartBindingCallback = {
  viewport: (x: number, size: number) => void
  timelineCursor: (timelineCursor: number | undefined) => void
}

export class FlamechartBindingManager {
  private listening = true
  private readonly listeners: Set<FlamechartBindingCallback> = new Set()

  addListener(listener: FlamechartBindingCallback) {
    this.listeners.add(listener)
  }

  removeListener(listener: FlamechartBindingCallback) {
    this.listeners.delete(listener)
  }

  notifyViewport(x: number, size: number) {
    this.listening && this.listeners.forEach((listener) => listener.viewport(x, size))
  }

  notifyTimelineCursor(timelineCursor: number | undefined) {
    this.listening && this.listeners.forEach((listener) => listener.timelineCursor(timelineCursor))
  }

  turnOff() {
    this.listening = false
  }

  turnOn() {
    this.listening = true
  }
}
