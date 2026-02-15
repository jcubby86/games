import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { ButtonVariant } from 'react-bootstrap/types';
import { createPortal } from 'react-dom';

import { SpinnerButton } from './SpinnerButton';

type Message = {
  title: string;
  body: string;
  onConfirm: () => Promise<any>;
  confirmVariant?: ButtonVariant;
};

const listeners: Array<(m: Message) => void> = [];

export function showModal(msg: Message) {
  listeners.forEach((l) => l(msg));
}

export function ModalPortal() {
  const [message, setMessage] = useState<Message | null>(null);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const confirm = async () => {
    setLoading(true);
    try {
      await message?.onConfirm();
      setShow(false);
    } finally {
      setLoading(false);
    }
  };
  const cancel = () => setShow(false);

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
    <Modal
      show={show}
      onHide={cancel}
      backdrop="static"
      keyboard={false}
      className="my-5"
    >
      <Modal.Header closeButton>
        <Modal.Title>{message?.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{message?.body}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={cancel} disabled={loading}>
          Cancel
        </Button>
        <SpinnerButton
          variant={message?.confirmVariant || 'primary'}
          onClick={() => void confirm()}
          disabled={loading}
        >
          Confirm
        </SpinnerButton>
      </Modal.Footer>
    </Modal>,
    document.body
  );
}
