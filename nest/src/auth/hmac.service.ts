import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

interface AuthPayload {
  game: { uuid: string };
  player: { uuid: string };
}

@Injectable()
export class HmacService {
  private readonly secret: string;
  private readonly algorithm = 'sha1'; // SHA-1 is shorter: 28 chars vs 44 chars

  constructor(private configService: ConfigService) {
    const hmacSecret = this.configService.get<string>('HMAC_SECRET');

    if (!hmacSecret) {
      throw new Error('HMAC_SECRET is not defined in environment variables');
    }
    this.secret = hmacSecret;
  }

  private sign(payload: string): string {
    return crypto
      .createHmac(this.algorithm, this.secret)
      .update(payload)
      .digest('base64url');
  }

  generateToken(game: { uuid: string }, player: { uuid: string }): string {
    const authPayload: AuthPayload = {
      game: { uuid: game.uuid },
      player: { uuid: player.uuid },
    };

    const payload = JSON.stringify(authPayload);

    const signature = this.sign(payload);

    return `${Buffer.from(payload).toString('base64url')}.${signature}`;
  }

  validateToken(token: string): AuthPayload | null {
    const [encodedPayload, providedSignature] = token.split('.');

    if (!encodedPayload || !providedSignature) {
      return null;
    }

    const payload = Buffer.from(encodedPayload, 'base64url').toString('utf8');

    const expectedSignature = this.sign(payload);

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(providedSignature, 'utf8'),
    );

    if (!isValid) {
      return null;
    }

    return JSON.parse(payload) as AuthPayload;
  }
}
