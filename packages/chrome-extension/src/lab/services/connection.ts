export class Connection {
  static connectionFactory: () => Connection
  static setFactory(factory: () => Connection): void {
    this.connectionFactory = factory
  }

  static getFactory(): () => Connection {
    return this.connectionFactory
  }
  onMessage!: ((arg0: any) => void) | null
  constructor() {}

  setOnMessage(_onMessage: (arg0: any | string) => void): void {}

  setOnDisconnect(_onDisconnect: (arg0: string) => void): void {}

  sendRawMessage(_message: string): void {}

  disconnect(): Promise<void> {
    throw new Error('not implemented')
  }
}

export interface ParallelConnectionInterface extends Connection {
  getSessionId: () => string
  getOnDisconnect: () => ((arg0: string) => void) | null
}

export class ParallelConnection implements ParallelConnectionInterface {
  readonly #connection: Connection
  #sessionId: string
  onMessage: ((arg0: any) => void) | null
  #onDisconnect: ((arg0: string) => void) | null
  constructor(connection: Connection, sessionId: string) {
    this.#connection = connection
    this.#sessionId = sessionId
    this.onMessage = null
    this.#onDisconnect = null
  }

  setOnMessage(onMessage: (arg0: any) => void): void {
    this.onMessage = onMessage
  }

  setOnDisconnect(onDisconnect: (arg0: string) => void): void {
    this.#onDisconnect = onDisconnect
  }

  getOnDisconnect(): ((arg0: string) => void) | null {
    return this.#onDisconnect
  }

  sendRawMessage(message: string): void {
    const messageObject = JSON.parse(message)
    // If the message isn't for a specific session, it must be for the root session.
    if (!messageObject.sessionId) {
      messageObject.sessionId = this.#sessionId
    }
    this.#connection.sendRawMessage(JSON.stringify(messageObject))
  }

  getSessionId(): string {
    return this.#sessionId
  }

  async disconnect(): Promise<void> {
    if (this.#onDisconnect) {
      this.#onDisconnect.call(null, 'force disconnect')
    }
    this.#onDisconnect = null
    this.onMessage = null
    return Promise.resolve()
  }
}
