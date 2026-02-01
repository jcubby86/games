import { Logger, UseGuards } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WebsocketAuthGuard } from 'src/auth/websocket-auth.guard';
import type { GameUpdatedEvent } from 'src/game/game.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: false,
  },
})
@UseGuards(WebsocketAuthGuard)
export class EventGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly logger = new Logger(EventGateway.name);
  private server: Server;

  afterInit(server: Server) {
    this.server = server;
    this.logger.log('WebSocket server initialized');
  }

  async handleConnection(client: Socket) {
    const headers = client.handshake.headers;
    const gameUuid = headers['x-game-uuid'] as string;
    const playerUuid = headers['x-player-uuid'] as string;

    await client.join(gameUuid);
    await client.join(playerUuid);

    this.logger.log(
      `Websocket client connected: ${client.id}, Player: ${playerUuid}, Game: ${gameUuid}`,
    );
  }

  @SubscribeMessage('poke')
  handlePoke(
    client: Socket,
    data: {
      to: string;
      from: string;
      nickname?: string;
    },
  ) {
    if (data.to === data.from) return;

    this.logger.debug(
      `Received poke event from player: ${data.from} to: ${data.to}`,
    );

    this.server.to(data.to).emit('poke', {
      from: data.from,
      message: `You have been poked by ${data.nickname || data.from}!`,
      nickname: data.nickname,
      time: new Date().toISOString(),
    });
  }

  @OnEvent('game.updated')
  emitGameUpdate(event: GameUpdatedEvent) {
    const payload = JSON.stringify({
      gameUuid: event.game.uuid,
      playerUuid: event.player?.uuid,
      nickname: event.player?.nickname,
      action: event.action,
    });

    this.logger.debug(
      `Emitting game update for game ${event.game.uuid}: ${JSON.stringify(payload)}`,
    );
    this.server.to(event.game.uuid).emit('game.updated', payload);
  }
}
