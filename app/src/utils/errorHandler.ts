import { AxiosError, CanceledError } from 'axios';

import { showToast } from '../components/ToastPortal';

const getErrorMessages = (message: string, err: unknown) => {
  if (err instanceof CanceledError) {
    return null;
  } else if (err instanceof AxiosError) {
    const status = err.response?.status;
    const responseMessage = err.response?.data?.message;
    const detailed = status
      ? `${message} (${status}): ${responseMessage || err.message}`
      : `${message}: ${responseMessage || err.message}`;
    const friendly = responseMessage
      ? `${message}: ${responseMessage}`
      : message;

    return { friendly, detailed };
  } else if (err instanceof Error) {
    return {
      detailed: `${message}: ${err.message}`
    };
  } else {
    return {
      detailed: `${message}: ${String(err)}`
    };
  }
};

export const logError = (message: string, err: unknown): void => {
  const errorMessage = getErrorMessages(message, err);
  if (errorMessage) {
    console.error(errorMessage.detailed);
  }
};

export const alertError = (message: string, err: unknown): void => {
  const errorMessage = getErrorMessages(message, err);
  if (errorMessage) {
    console.error(errorMessage.detailed);
    showToast({
      message: errorMessage.friendly ?? message,
      type: 'danger'
    });
  }
};
