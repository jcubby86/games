import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { AuthPayload, AuthService } from 'src/auth/auth.service';
import type { GameUpdatedEvent } from 'src/game/game.service';

interface AuthenticatedSocket extends Socket, AuthPayload {}

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

  constructor(private readonly authService: AuthService) {}

  afterInit(server: Server) {
    this.server = server;
    this.logger.log('WebSocket server initialized');

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    server.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.bearer as string;
        if (!token) {
          return next(new Error('Bearer token is missing'));
        }

        const authToken = await this.authService.verifyAsync(token);
        socket.player = authToken.player;
        socket.game = authToken.game;

        await socket.join([
          `game:${authToken.game.uuid}`,
          `player:${authToken.player.uuid}`,
        ]);

        this.logger.log(
          `Websocket client connected: ${socket.id}, Player: ${authToken.player.uuid}, Game: ${authToken.game.uuid}`,
        );
        this.logger.debug(
          `Socket rooms: ${Array.from(socket.rooms).join(', ')}`,
        );

        return next();
      } catch (error: unknown) {
        return next(error as Error);
      }
    });
  }

  @SubscribeMessage('poke')
  handlePoke(
    socket: AuthenticatedSocket,
    data: {
      to: string;
    },
  ) {
    if (data.to === socket.player.uuid) return;

    this.server.to(`player:${data.to}`).emit('poke', {
      from: socket.player,
      message: `You have been poked by ${socket.player.uuid}!`,
      time: new Date().toISOString(),
    });

    this.logger.debug(
      `Sent poke event from player: ${socket.player.uuid} to: ${data.to}`,
    );
  }

  @SubscribeMessage('game.recreated')
  handleGameRecreated(socket: AuthenticatedSocket, data) {
    const playerRoles = socket.player.roles || [];
    if (!AuthService.matchRoles(playerRoles, ['host'])) {
      this.logger.warn(
        `Unauthorized game.recreated event from player: ${socket.player.uuid}`,
      );
      return;
    }

    socket.broadcast
      .to(`game:${socket.game.uuid}`)
      .emit('game.recreated', data);

    this.logger.debug('Sent game.recreated event: ' + JSON.stringify(data));
  }

  @OnEvent('game.updated')
  emitGameUpdate(event: GameUpdatedEvent) {
    const payload = JSON.stringify({
      game: {
        uuid: event.game.uuid,
        phase: event.game.phase,
        type: event.game.type,
      },
      player: event.player
        ? {
            uuid: event.player.uuid,
            nickname: event.player.nickname,
          }
        : undefined,
      action: event.action,
    });

    this.server.to(`game:${event.game.uuid}`).emit('game.updated', payload);

    this.logger.debug(
      `Sent game.updated event to game:${event.game.uuid}: ${payload}`,
    );
  }
}
