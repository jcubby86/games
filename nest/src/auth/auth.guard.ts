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

@Injectable()
export class GameAuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: AuthorizedRequest = context.switchToHttp().getRequest();

    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Invalid authorization token');
    }

    const authToken = await this.authService.verifyAsync(token);
    request.player = authToken.player;
    request.game = authToken.game;

    const uuid = request.params.uuid;
    if (
      !uuid ||
      !(authToken.game.uuid === uuid || authToken.player.uuid === uuid)
    ) {
      throw new ForbiddenException('You do not have access to this resource');
    }

    return this.checkRoles(request, context);
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private checkRoles(
    request: AuthorizedRequest,
    context: ExecutionContext,
  ): boolean {
    const roles = this.reflector.get(Roles, context.getHandler());
    if (!roles || roles.length === 0) {
      return true;
    }

    const playerRoles: string[] = request.player.roles || [];
    if (!roles.some((role) => playerRoles.includes(role))) {
      throw new ForbiddenException('You do not have access to this resource');
    }
    return true;
  }
}
