import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { HmacService } from './hmac.service';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WebsocketAuthGuard implements CanActivate {
  constructor(private hmacService: HmacService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToWs().getClient<Socket>();

    // Extract player UUID and authorization header
    const playerUuid = request.handshake.headers['x-player-uuid'] as string;
    const authHeader = request.handshake.headers.authorization as string;

    if (!playerUuid || !authHeader) {
      throw new WsException('Player authorization required');
    }

    // Parse authorization header: "Bearer gameToken:playerToken"
    const [scheme, tokens] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !tokens) {
      throw new WsException('Invalid authorization format');
    }

    const [, playerToken] = tokens.split(':');

    if (!playerToken) {
      throw new WsException('Invalid auth tokens format');
    }

    if (!this.hmacService.validateToken(playerUuid, playerToken)) {
      throw new WsException('Invalid player authorization');
    }

    return true;
  }
}
