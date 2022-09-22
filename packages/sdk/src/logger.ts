export interface Logger {
  log: (msg: string) => void
  error: (msg: string) => void
}

export const ConsoleLogger: Logger = {
  log: (msg) => console.info(msg),
  error: (msg) => console.error(msg),
}
