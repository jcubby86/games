import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { GameUpdatedEvent } from 'src/game/game.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventGateway implements OnGatewayInit {
  private readonly logger = new Logger(EventGateway.name);
  private server: Server;

  afterInit(server: Server) {
    this.server = server;
    this.logger.log('WebSocket server initialized');
  }

  @SubscribeMessage('game.join')
  handleEvent(
    client: Socket,
    data: {
      gameUuid: string;
      playerUuid: string;
    },
  ) {
    this.logger.log(`Received game.join event from client: ${client.id}`);

    void client.join(data.gameUuid);
    void client.join(data.playerUuid);
  }

  @OnEvent('game.updated')
  emitGameUpdate(event: GameUpdatedEvent) {
    const payload = JSON.stringify({
      gameUuid: event.game.uuid,
      playerUuid: event.player?.uuid,
      nickname: event.player?.nickname,
      action: event.action,
    });

    this.logger.log(
      `Emitting game update for game ${event.game.uuid}: ${JSON.stringify(payload)}`,
    );
    this.server.to(event.game.uuid).emit('game.updated', payload);
  }
}
