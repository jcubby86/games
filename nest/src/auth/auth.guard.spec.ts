import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';

import { GameAuthGuard, JwtAuthGuard, Roles } from './auth.guard';
import { AuthPayload, AuthService } from './auth.service';

function makeContext(overrides: {
  authorization?: string;
  params?: Record<string, string>;
  handler?: object;
}): ExecutionContext {
  const request = {
    headers: { authorization: overrides.authorization },
    params: overrides.params ?? {},
  };

  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => overrides.handler ?? {},
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let authService: { verifyAsync: jest.Mock };

  beforeEach(async () => {
    authService = { verifyAsync: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    guard = module.get(JwtAuthGuard);
  });

  it('rejects requests with no authorization header', async () => {
    const context = makeContext({});
    await expect(guard.canActivate(context)).rejects.toThrow(
      'Invalid authorization token',
    );
    expect(authService.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects a non-Bearer authorization header', async () => {
    const context = makeContext({ authorization: 'Basic abc123' });
    await expect(guard.canActivate(context)).rejects.toThrow(
      'Invalid authorization token',
    );
  });

  it('rejects a token that fails verification', async () => {
    authService.verifyAsync.mockRejectedValue(new Error('bad signature'));
    const context = makeContext({ authorization: 'Bearer bad-token' });

    await expect(guard.canActivate(context)).rejects.toThrow('bad signature');
  });

  it('allows a request with a validly signed token', async () => {
    const payload: AuthPayload = {
      game: { uuid: 'game-uuid' },
      player: { uuid: 'player-uuid', nickname: 'nick' },
    };
    authService.verifyAsync.mockResolvedValue(payload);
    const context = makeContext({ authorization: 'Bearer good-token' });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(authService.verifyAsync).toHaveBeenCalledWith('good-token');
  });
});

describe('GameAuthGuard', () => {
  let guard: GameAuthGuard;
  let authService: { verifyAsync: jest.Mock };

  const payload: AuthPayload = {
    game: { uuid: 'game-uuid' },
    player: { uuid: 'player-uuid', nickname: 'nick', roles: ['host'] },
  };

  beforeEach(async () => {
    authService = { verifyAsync: jest.fn().mockResolvedValue(payload) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameAuthGuard,
        Reflector,
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    guard = module.get(GameAuthGuard);
  });

  it('rejects when the route uuid does not belong to the token', async () => {
    const context = makeContext({
      authorization: 'Bearer good-token',
      params: { uuid: 'someone-elses-uuid' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('allows access when the route uuid matches the player', async () => {
    const context = makeContext({
      authorization: 'Bearer good-token',
      params: { uuid: 'player-uuid' },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('allows access when the route uuid matches the game', async () => {
    const context = makeContext({
      authorization: 'Bearer good-token',
      params: { uuid: 'game-uuid' },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('rejects when the player lacks a required role', async () => {
    class DummyController {
      @Roles(['host'])
      handler() {}
    }

    authService.verifyAsync.mockResolvedValue({
      ...payload,
      player: { ...payload.player, roles: ['player'] },
    });
    const context = makeContext({
      authorization: 'Bearer good-token',
      params: { uuid: 'player-uuid' },
      // eslint-disable-next-line @typescript-eslint/unbound-method -- only used as a metadata holder, never invoked
      handler: new DummyController().handler,
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
