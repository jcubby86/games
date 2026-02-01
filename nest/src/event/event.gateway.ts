import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { HmacService } from 'src/auth/hmac.service';
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
export class EventGateway implements OnGatewayInit {
  private readonly logger = new Logger(EventGateway.name);
  private server: Server;

  constructor(private readonly hmacService: HmacService) {}

  afterInit(server: Server) {
    this.server = server;
    this.logger.log('WebSocket server initialized');

    server.use((socket, next) => {
      const token = socket.handshake.auth.bearer as string;
      if (!token) {
        return next(new Error('Authentication token is missing'));
      }

      const authToken = this.hmacService.validateToken(token);
      if (!authToken) {
        return next(new Error('Invalid authentication token'));
      }

      void socket.join([
        `game:${authToken.game.uuid}`,
        `player:${authToken.player.uuid}`,
      ]);

      this.logger.log(
        `Websocket client connected: ${socket.id}, Player: ${authToken.player.uuid}, Game: ${authToken.game.uuid}`,
      );

      next();
    });
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

    this.server.to(`player:${data.to}`).emit('poke', {
      from: data.from,
      message: `You have been poked by ${data.nickname || data.from}!`,
      nickname: data.nickname,
      time: new Date().toISOString(),
    });

    this.logger.debug(
      `Sent poke event from player: ${data.from} to: ${data.to}`,
    );
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
      `Emitting game update for game ${event.game.uuid}: ${payload}`,
    );
    this.server.to(`game:${event.game.uuid}`).emit('game.updated', payload);
  }
}
