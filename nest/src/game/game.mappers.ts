import { GameDto, PlayerDto } from '@games/shared';

import { Game, Player } from 'src/generated/prisma/client';

export function mapToGameDto(game: Game, players?: PlayerDto[]): GameDto {
  return {
    type: game.type,
    code: game.code,
    uuid: game.uuid,
    phase: game.phase,
    players,
  };
}

export function mapToPlayerDto(
  player: Player,
  canSubmit?: boolean,
  game?: GameDto,
  roles?: string[],
): PlayerDto {
  return {
    uuid: player.uuid,
    nickname: player.nickname,
    color: player.color,
    canSubmit: canSubmit ?? false,
    game,
    roles,
  };
}
