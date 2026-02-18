import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { GameDto, PlayerDto } from 'src/game/game.types';

export interface AuthPayload {
  game: { uuid: string };
  player: { uuid: string; nickname: string; roles?: string[] };
}

@Injectable()
export class AuthService {
  private readonly secret: string;

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    this.secret = jwtSecret;
  }

  async generateTokenAsync(game: GameDto, player: PlayerDto): Promise<string> {
    const payload: AuthPayload = {
      game: { uuid: game.uuid },
      player: {
        uuid: player.uuid,
        nickname: player.nickname,
        roles: player.roles,
      },
    };
    try {
      return this.jwtService.signAsync(payload, {
        secret: this.secret,
      });
    } catch (error: unknown) {
      throw new InternalServerErrorException(
        error as Error,
        'Failed to generate authentication token',
      );
    }
  }

  async verifyAsync(token: string): Promise<AuthPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<AuthPayload>(token, {
        secret: this.secret,
      });
      return payload;
    } catch (error: unknown) {
      throw new UnauthorizedException(
        error as Error,
        'Failed to verify authentication token',
      );
    }
  }

  static matchRoles(playerRoles: string[], requiredRoles: string[]): boolean {
    return requiredRoles.some((role) => playerRoles.includes(role));
  }
}
