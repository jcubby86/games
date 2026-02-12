import { useQueryClient, useQuery } from '@tanstack/react-query';

import { useAppContext } from '../contexts/AppContext';
import { getPlayer } from '../utils/apiClient';
import { PlayerDto } from '../utils/types';

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
      queryClient.setQueryData(queryKey, updater);
    }
  };

  return { playerQuery, invalidatePlayerQuery, setPlayerQueryData };
};
