import { useEffect, useState } from 'react';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import { Variant } from 'react-bootstrap/types';
import { createPortal } from 'react-dom';

type Message = {
  id: number;
  header: string;
  message: string;
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
  const [message, setMessage] = useState<Message | null>(null);
  const [show, setShow] = useState(false);

  const close = () => setShow(false);

  useEffect(() => {
    const listener = (m: Message) => {
      setMessage(m);
      setShow(true);
    };
    listeners.push(listener);
    return () => {
      listeners.splice(listeners.indexOf(listener), 1);
    };
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div aria-live="polite" aria-atomic="true" className="position-relative">
      <ToastContainer position="bottom-center" className="pb-5">
        <Toast
          key={`toast-${message?.id}`}
          onClose={close}
          bg={message?.type}
          className={`text-bg-${message?.type}`}
          delay={5000}
          autohide
          show={show}
        >
          <Toast.Header>
            <strong className="me-auto">{message?.header}</strong>
          </Toast.Header>
          <Toast.Body>{message?.message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>,
    document.body
  );
}
