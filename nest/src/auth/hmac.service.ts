import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

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

  generateToken(playerUuid: string): string {
    return crypto
      .createHmac(this.algorithm, this.secret)
      .update(`player:${playerUuid}`)
      .digest('base64url'); // Truncate to 16 chars for shorter tokens
  }

  validateToken(gameUuid: string, providedToken: string): boolean {
    const expectedToken = this.generateToken(gameUuid);
    return crypto.timingSafeEqual(
      Buffer.from(expectedToken, 'utf8'),
      Buffer.from(providedToken, 'utf8'),
    );
  }

  /**
   * Generate combined auth tokens for both game and player
   * Format: "gameToken:playerToken"
   */
  generateCombinedTokens(gameUuid: string, playerUuid: string): string {
    const gameToken = this.generateToken(gameUuid);
    const playerToken = this.generateToken(playerUuid);
    return `${gameToken}:${playerToken}`;
  }
}
