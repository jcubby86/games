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

  const leavePreviousGame = async () => {
    if (!context.player || !context.token) {
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

    try {
      await deletePlayer(context.token, context.player.uuid);
    } catch (err: unknown) {
      logError('Error leaving previous game', err);
    }
    dispatchContext({ type: 'clear' });
    void navigate('/');
  };

  if (context.player && context.token) {
    return (
      <button
        className={`btn btn-outline-danger ${confirm ? 'active' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          void leavePreviousGame();
        }}
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
