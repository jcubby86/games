import { useEffect, useState } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { Variant } from 'react-bootstrap/esm/types';
import { createPortal } from 'react-dom';

type Message = {
  id: number;
  message: string;
  header: string;
  type: Variant;
};

const listeners: Array<(m: Message) => void> = [];
let idCounter = 0;

export function showToast(opts: Omit<Message, 'id'>) {
  const id = ++idCounter;
  const msg: Message = { id, ...opts };
  listeners.forEach((l) => l(msg));
  return id;
}

export function ToastPortal() {
  const [messages, setMessages] = useState<Message[]>([]);

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
    <div aria-live="polite" aria-atomic="true" className="position-relative">
      <ToastContainer position="bottom-center" className="pb-5">
        {messages.map((m) => (
          <Toast
            key={`toast-${m.id}`}
            onClose={() => remove(m.id)}
            bg={m.type}
            className={`text-bg-${m.type}`}
            delay={5000}
            autohide
            animation={false}
          >
            <Toast.Header>
              <strong className="me-auto">{m.header}</strong>
            </Toast.Header>
            <Toast.Body>{m.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </div>,
    document.body
  );
}
