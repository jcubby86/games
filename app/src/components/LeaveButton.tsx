import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { showModal } from './ModalPortal';
import { SpinnerButton } from './SpinnerButton';
import { useAppContext } from '../contexts/AppContext';
import { deletePlayer } from '../utils/apiClient';
import { logError } from '../utils/errorHandler';

const LeaveButton = () => {
  const navigate = useNavigate();
  const { context, dispatchContext } = useAppContext();

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
    showModal({
      title: 'Leave Game',
      body: 'Are you sure you want to leave the game?',
      onConfirm: () => leaveGameMutation.mutateAsync(),
      confirmVariant: 'danger'
    });
  };

  if (context.player && context.token) {
    return (
      <SpinnerButton
        variant="outline-danger"
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          leavePreviousGame();
        }}
        disabled={leaveGameMutation.isPending}
      >
        <i className="bi bi-person-x mx-1"></i>
        Leave Game
      </SpinnerButton>
    );
  } else {
    return <></>;
  }
};

export default LeaveButton;
