import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { showToast } from './ToastPortal';
import { useAppContext } from '../contexts/AppContext';
import { deletePlayer } from '../utils/apiClient';
import { logError } from '../utils/errorHandler';

const LeaveButton = () => {
  const navigate = useNavigate();
  const { context, dispatchContext } = useAppContext();
  const [confirm, setConfirm] = useState(false);

  const leaveGameMutation = useMutation({
    mutationFn: () => deletePlayer(context.token!, context.player!.uuid),
    onError: (err: unknown) => logError('Error leaving game', err),
    onSettled: async () => {
      dispatchContext({ type: 'clear' });
      await navigate('/');
    }
  });

  const leavePreviousGame = () => {
    if (!context.player || !context.token || leaveGameMutation.isPending) {
      return;
    }
    if (!confirm) {
      setConfirm(true);
      showToast({
        message: "Press 'Confirm' to leave the current game.",
        type: 'danger'
      });

      setTimeout(() => setConfirm(false), 3500);
      return;
    }

    leaveGameMutation.mutate();
  };

  if (context.player && context.token) {
    return (
      <button
        className={`btn btn-sm btn-outline-danger ${confirm ? 'bg-danger-subtle' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          void leavePreviousGame();
        }}
        disabled={leaveGameMutation.isPending}
      >
        <i className="bi bi-person-x mx-1"></i>
        Leave Game
      </button>
    );
  } else {
    return <></>;
  }
};

export default LeaveButton;
