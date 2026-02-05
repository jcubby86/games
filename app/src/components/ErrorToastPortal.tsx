import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Message = {
  id: number;
  message: string;
  type: 'danger' | 'warning' | 'success';
};

const listeners: Array<(m: Message) => void> = [];
let idCounter = 0;

export function showErrorToast(opts: Omit<Message, 'id'>) {
  const id = ++idCounter;
  const msg: Message = { id, ...opts };
  listeners.forEach((l) => l(msg));
  return id;
}

type ToastProps = {
  message: string;
  type: 'danger' | 'warning' | 'success';
  onFinish: () => void;
};

function Toast({ message, type, onFinish }: ToastProps): JSX.Element | null {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.addEventListener('animationend', onFinish);
    return () => el.removeEventListener('animationend', onFinish);
  }, [onFinish]);

  return (
    <div
      className={`toast show align-items-center text-bg-${type} border-0 mb-2`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      ref={ref}
    >
      <div className="d-flex">
        <div className="toast-body">{message}</div>
        <button
          type="button"
          className="btn-close btn-close-white me-2 m-auto"
          data-bs-dismiss="toast"
          aria-label="Close"
          onClick={() => onFinish()}
        ></button>
      </div>
    </div>
  );
}

export function ToastPortal(): JSX.Element | null {
  const [messages, setMessages] = useState<Message[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const listener = (m: Message) => setMessages((prev) => [...prev, m]);
    listeners.push(listener);
    return () => {
      listeners.splice(listeners.indexOf(listener), 1);
    };
  }, []);

  const remove = (id: number) =>
    setMessages((prev) => prev.filter((m) => m.id !== id));

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div ref={containerRef} className="toast-root">
      {messages.map((m) => (
        <Toast
          key={m.id}
          message={m.message}
          type={m.type}
          onFinish={() => remove(m.id)}
        />
      ))}
    </div>,
    document.body
  );
}
