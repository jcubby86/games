import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { HmacService } from './hmac.service';

@Injectable()
export class PlayerAuthGuard implements CanActivate {
  constructor(private hmacService: HmacService) {}

  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();

    // Extract player UUID and authorization header
    const playerUuid = request.params.uuid as string;
    const authHeader = request.headers.authorization as string;

    if (!playerUuid || !authHeader) {
      throw new UnauthorizedException('Player authorization required');
    }

    // Parse authorization header: "Bearer gameToken:playerToken"
    const [scheme, tokens] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !tokens) {
      throw new UnauthorizedException('Invalid authorization format');
    }

    const [, playerToken] = tokens.split(':');

    if (!playerToken) {
      throw new UnauthorizedException('Invalid auth tokens format');
    }

    if (!this.hmacService.validateToken(playerUuid, playerToken)) {
      throw new UnauthorizedException('Invalid player authorization');
    }

    return true;
  }
}
