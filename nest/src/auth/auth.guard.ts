import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { HmacService } from './hmac.service';

@Injectable()
export class GameAuthGuard implements CanActivate {
  constructor(private hmacService: HmacService) {}

  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();

    const authHeader = (request.headers.authorization as string) || '';
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Auhorization header is malformed');
    }

    const authToken = this.hmacService.validateToken(token);
    if (!authToken) {
      throw new UnauthorizedException('Invalid authorization token');
    }

    const uuid = request.params.uuid;
    if (
      !uuid ||
      !(authToken.game.uuid === uuid || authToken.player.uuid === uuid)
    ) {
      throw new ForbiddenException('You do not have access to this resource');
    }

    return true;
  }
}
