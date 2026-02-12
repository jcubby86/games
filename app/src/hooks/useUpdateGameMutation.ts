import { useMutation } from '@tanstack/react-query';

import { usePlayerQuery } from './usePlayerQuery';
import { useAppContext } from '../contexts/AppContext';
import { patchGame } from '../utils/apiClient';
import { alertError } from '../utils/errorHandler';
import { PlayerDto } from '../utils/types';

export const useUpdateGameMutation = () => {
  const { context } = useAppContext();
  const { setPlayerQueryData } = usePlayerQuery();

  const updateGameMutation = useMutation({
    mutationFn: ({ phase }: { phase: string }) =>
      patchGame(context.token!, context.game!.uuid, phase),
    onSuccess: (gameResponse) => {
      setPlayerQueryData((oldData: PlayerDto) => {
        return {
          ...oldData,
          game: {
            ...oldData.game!,
            phase: gameResponse.data.phase
          }
        };
      });
    },
    onError: (err: unknown) => alertError('Error updating game', err)
  });

  return updateGameMutation;
};
