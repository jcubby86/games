import { GameDto, PlayerDto } from '@games/shared';
import {
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthService } from './auth.service';

const gameDto = { uuid: 'game-uuid' } as GameDto;
const playerDto = {
  uuid: 'player-uuid',
  nickname: 'nick',
  roles: ['host'],
} as PlayerDto;

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    jwtService = { signAsync: jest.fn(), verifyAsync: jest.fn() };
    configService = { get: jest.fn().mockReturnValue('test-secret') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: ConfigService, useValue: configService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('throws during construction when JWT_SECRET is not configured', () => {
    const missingSecretConfig = { get: jest.fn().mockReturnValue(undefined) };
    expect(
      () =>
        new AuthService(
          missingSecretConfig as unknown as ConfigService,
          jwtService as unknown as JwtService,
        ),
    ).toThrow('JWT_SECRET is not defined in environment variables');
  });

  describe('generateTokenAsync', () => {
    it('signs a payload built from the game and player', async () => {
      jwtService.signAsync.mockResolvedValue('signed-token');

      const token = await service.generateTokenAsync(gameDto, playerDto);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          game: { uuid: 'game-uuid' },
          player: {
            uuid: 'player-uuid',
            nickname: 'nick',
            roles: ['host'],
          },
        },
        { secret: 'test-secret' },
      );
      expect(token).toBe('signed-token');
    });

    it('wraps a signing failure in an InternalServerErrorException', async () => {
      jwtService.signAsync.mockRejectedValue(new Error('signing broke'));

      await expect(
        service.generateTokenAsync(gameDto, playerDto),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('verifyAsync', () => {
    it('returns the decoded payload on success', async () => {
      const payload = { game: gameDto, player: playerDto };
      jwtService.verifyAsync.mockResolvedValue(payload);

      const result = await service.verifyAsync('a-token');

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('a-token', {
        secret: 'test-secret',
      });
      expect(result).toEqual(payload);
    });

    it('wraps a verification failure in an UnauthorizedException', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('bad token'));

      await expect(service.verifyAsync('a-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('matchRoles', () => {
    it('returns true when the player has at least one required role', () => {
      expect(AuthService.matchRoles(['host', 'player'], ['host'])).toBe(true);
    });

    it('returns false when none of the required roles match', () => {
      expect(AuthService.matchRoles(['player'], ['host'])).toBe(false);
    });
  });
});
