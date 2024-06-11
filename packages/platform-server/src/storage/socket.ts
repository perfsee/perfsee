/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

import { BaseObjectStorage } from './providers/provider'

@WebSocketGateway()
export class FileSocketGateWay {
  @WebSocketServer() server!: Server

  constructor(private readonly storage: BaseObjectStorage) {}

  @SubscribeMessage('file')
  async handleSubscriptFile(client: Socket, payload: { name: string }) {
    try {
      const stream = await this.storage.getStream(payload.name)

      stream
        .on('data', (chunk) => {
          client.emit('data', chunk)
        })
        .on('end', () => {
          client.emit('end')
        })
        .on('error', (e) => {
          client.emit('error', {
            message: e.message,
          })
        })
        .on('close', () => {
          client.emit('close')
        })
    } catch (e: any) {
      client.emit('error', { message: e.message })
    }
  }
}
