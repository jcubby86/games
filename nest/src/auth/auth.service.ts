import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

interface AuthPayload {
  game: { uuid: string };
  player: { uuid: string };
}

@Injectable()
export class AuthService {
  private readonly secret: string;
  private readonly algorithm = 'sha1'; // SHA-1 is shorter: 28 chars vs 44 chars

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

  async generateTokenAsync(
    game: { uuid: string },
    player: { uuid: string },
  ): Promise<string> {
    const payload: AuthPayload = {
      game: { uuid: game.uuid },
      player: { uuid: player.uuid },
    };
    return this.jwtService.signAsync(payload, {
      secret: this.secret,
    });
  }

  async verifyAsync(token: string): Promise<AuthPayload> {
    const payload = await this.jwtService.verifyAsync(token, {
      secret: this.secret,
    });
    return payload as AuthPayload;
  }
}
