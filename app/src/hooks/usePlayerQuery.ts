import { useQueryClient, useQuery } from '@tanstack/react-query';

import { useAppContext } from '../contexts/AppContext';
import { getPlayer } from '../utils/apiClient';
import { GameDto, PlayerDto } from '../utils/types';

const transformGame = (
  game: GameDto | undefined,
  updates: Partial<GameDto>
) => {
  if (!game) return undefined;
  return {
    ...game,
    ...updates
  };
};

export const usePlayerQuery = () => {
  const { context } = useAppContext();
  const queryClient = useQueryClient();

  const queryKey = ['players', { uuid: context.player?.uuid }];

  const playerQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const playerResponse = await getPlayer(
        context.token!,
        context.player!.uuid
      );
      return playerResponse.data;
    },
    enabled: !!context.player?.uuid && !!context.token,
    staleTime: 120000 // 2 minutes
  });

  const invalidatePlayerQuery = async () => {
    if (!playerQuery.isFetching) {
      await queryClient.invalidateQueries({
        queryKey
      });
    }
  };

  const setPlayerQueryData = (updater: (oldData: PlayerDto) => PlayerDto) => {
    if (!playerQuery.isFetching) {
      queryClient.setQueryData(queryKey, (oldData: PlayerDto | undefined) => {
        if (!oldData) return undefined;
        return updater(oldData);
      });
    }
  };

  const setPlayerSubmitted = () => {
    setPlayerQueryData((oldData) => {
      const players: PlayerDto[] | undefined = oldData.game?.players?.map(
        (p) => ({
          ...p,
          canSubmit: p.uuid !== oldData.uuid && p.canSubmit
        })
      );

      return {
        ...oldData,
        canSubmit: false,
        game: transformGame(oldData.game, { players })
      } satisfies PlayerDto;
    });
  };

  const setGamePhase = (phase: string) => {
    setPlayerQueryData((oldData) => {
      return {
        ...oldData,
        game: transformGame(oldData.game, { phase })
      } satisfies PlayerDto;
    });
  };

  return {
    playerQuery,
    invalidatePlayerQuery,
    setPlayerSubmitted,
    setGamePhase
  };
};
