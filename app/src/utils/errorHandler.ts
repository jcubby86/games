import { AxiosError, CanceledError } from 'axios';

import { showErrorToast } from '../components/ErrorToastPortal';

const getErrorMessage = (message: string, err: unknown): string | null => {
  if (err instanceof CanceledError) {
    return null;
  } else if (err instanceof AxiosError) {
    const status = err.response?.status;
    const detail = err.response?.data?.message || err.message;
    return status
      ? `${message} (${status}): ${detail}`
      : `${message}: ${detail}`;
  } else if (err instanceof Error) {
    return `${message}: ${err.message}`;
  } else {
    return `${message}: ${String(err)}`;
  }
};

export const logError = (message: string, err: unknown): void => {
  const errorMessage = getErrorMessage(message, err);
  if (errorMessage) {
    console.error(errorMessage);
  }
};

export const alertError = (message: string, err: unknown): void => {
  const errorMessage = getErrorMessage(message, err);
  if (errorMessage) {
    console.error(errorMessage);
    showErrorToast({ message: errorMessage, type: 'danger' });
  }
};
