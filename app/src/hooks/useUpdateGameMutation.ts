import { useMutation } from '@tanstack/react-query';

import { usePlayerQuery } from './usePlayerQuery';
import { useAppContext } from '../contexts/AppContext';
import { patchGame } from '../utils/apiClient';
import { alertError } from '../utils/errorHandler';

export const useUpdateGameMutation = () => {
  const { context } = useAppContext();
  const { setGamePhase } = usePlayerQuery();

  const updateGameMutation = useMutation({
    mutationFn: ({ phase }: { phase: string }) =>
      patchGame(context.token!, context.game!.uuid, phase),
    onSuccess: (gameResponse) => setGamePhase(gameResponse.data.phase),
    onError: (err: unknown) => alertError('Error updating game', err)
  });

  return updateGameMutation;
};
