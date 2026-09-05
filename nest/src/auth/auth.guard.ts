import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { AuthPayload, AuthService } from './auth.service';

export const Roles = Reflector.createDecorator<string[]>();

export interface AuthorizedRequest extends Request, AuthPayload {}

/**
 * Verifies the request carries a valid, signed JWT. Does not check that the
 * token's game/player matches any route param, and does not check roles -
 * use GameAuthGuard for that.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(protected authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: AuthorizedRequest = context.switchToHttp().getRequest();

    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Invalid authorization token');
    }

    const authToken = await this.authService.verifyAsync(token);
    request.player = authToken.player;
    request.game = authToken.game;

    return true;
  }

  protected extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

@Injectable()
export class GameAuthGuard extends JwtAuthGuard {
  constructor(
    authService: AuthService,
    private reflector: Reflector,
  ) {
    super(authService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);

    const request: AuthorizedRequest = context.switchToHttp().getRequest();
    const uuid = request.params.uuid;
    if (
      !uuid ||
      !(request.game.uuid === uuid || request.player.uuid === uuid)
    ) {
      throw new ForbiddenException('You do not have access to this resource');
    }

    return this.checkRoles(request, context);
  }

  private checkRoles(
    request: AuthorizedRequest,
    context: ExecutionContext,
  ): boolean {
    const requiredRoles = this.reflector.get(Roles, context.getHandler());
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const playerRoles: string[] = request.player.roles || [];
    if (!AuthService.matchRoles(playerRoles, requiredRoles)) {
      throw new ForbiddenException('You do not have access to this resource');
    }
    return true;
  }
}
