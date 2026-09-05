import { AxiosError, CanceledError } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { alertError, logError } from './errorHandler';
import * as ToastPortal from '../components/ToastPortal';

function axiosErrorWithResponse(status: number, message: string) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return new AxiosError('Request failed', undefined, undefined, undefined, {
    status,
    data: { message }
  } as any);
}

describe('logError', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs a plain Error message', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logError('Something broke', new Error('boom'));

    expect(spy).toHaveBeenCalledWith('Something broke: boom');
  });

  it('does not log for a canceled request', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logError('Something broke', new CanceledError());

    expect(spy).not.toHaveBeenCalled();
  });

  it('includes the response status and server message for an AxiosError', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logError(
      'Error joining game',
      axiosErrorWithResponse(404, 'Game not found')
    );

    expect(spy).toHaveBeenCalledWith(
      'Error joining game (404): Game not found'
    );
  });
});

describe('alertError', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows a toast with the plain message for a non-Axios error', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const toastSpy = vi
      .spyOn(ToastPortal, 'showToast')
      .mockImplementation(() => 0);

    alertError('Error joining game', new Error('network down'));

    expect(toastSpy).toHaveBeenCalledWith({
      message: 'Error joining game',
      header: 'Error',
      type: 'danger'
    });
  });

  it('shows the server-provided friendly message for an AxiosError', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const toastSpy = vi
      .spyOn(ToastPortal, 'showToast')
      .mockImplementation(() => 0);

    alertError(
      'Error joining game',
      axiosErrorWithResponse(404, 'Game not found')
    );

    expect(toastSpy).toHaveBeenCalledWith({
      message: 'Error joining game: Game not found',
      header: 'Error',
      type: 'danger'
    });
  });

  it('does not show a toast for a canceled request', () => {
    const toastSpy = vi
      .spyOn(ToastPortal, 'showToast')
      .mockImplementation(() => 0);

    alertError('Error joining game', new CanceledError());

    expect(toastSpy).not.toHaveBeenCalled();
  });
});
