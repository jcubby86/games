import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Message = {
  id: number;
  message: string;
  type: 'danger' | 'warning' | 'success';
};

const listeners: Array<(m: Message) => void> = [];
let idCounter = 0;

export function showToast(opts: Omit<Message, 'id'>) {
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

function Toast({ message, type, onFinish }: ToastProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.addEventListener('animationend', onFinish);
    return () => el.removeEventListener('animationend', onFinish);
  }, [onFinish]);

  return (
    <div
      className={`toast show align-items-center bg-${type} border-0 mb-2 ${
        type === 'warning' ? 'text-dark' : 'text-white'
      }`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      data-bs-autohide="false"
      ref={ref}
    >
      <div className="d-flex">
        <div className="toast-body">{message}</div>
        <button
          type="button"
          className={`btn-close me-2 m-auto ${
            type === 'warning' ? '' : 'btn-close-white'
          }`}
          data-bs-dismiss="toast"
          aria-label="Close"
          onClick={() => onFinish()}
        ></button>
      </div>
    </div>
  );
}

export function ToastPortal() {
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
    <div ref={containerRef} className="toast-root toast-container pb-5">
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
