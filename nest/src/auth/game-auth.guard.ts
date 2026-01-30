import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { HmacService } from './hmac.service';

@Injectable()
export class GameAuthGuard implements CanActivate {
  constructor(private hmacService: HmacService) {}

  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();

    // Extract game UUID and authorization header
    const gameUuid = request.params.uuid as string;
    const authHeader = request.headers.authorization as string;

    if (!gameUuid || !authHeader) {
      throw new UnauthorizedException('Game authorization required');
    }

    // Parse authorization header: "Bearer gameToken:playerToken"
    const [scheme, tokens] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !tokens) {
      throw new UnauthorizedException('Invalid authorization format');
    }

    const [gameToken] = tokens.split(':');

    if (!gameToken) {
      throw new UnauthorizedException('Invalid auth tokens format');
    }

    if (!this.hmacService.validateToken(gameUuid, gameToken)) {
      throw new UnauthorizedException('Invalid game authorization');
    }

    return true;
  }
}
