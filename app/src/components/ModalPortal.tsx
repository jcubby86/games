import { useEffect, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { Variant } from 'react-bootstrap/esm/types';
import { createPortal } from 'react-dom';

type Message = {
  title: string;
  body: string;
  onConfirm: () => Promise<any>;
  confirmVariant?: Variant;
};

const listeners: Array<(m: Message) => void> = [];

export function showModal(msg: Message) {
  listeners.forEach((l) => l(msg));
}

export function ModalPortal() {
  const [message, setMessage] = useState<Message | null>(null);
  const [show, setShow] = useState(false);

  const confirm = async () => {
    await message?.onConfirm();
    setShow(false);
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
    <Modal show={show} onHide={cancel} backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>{message?.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{message?.body}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={cancel}>
          Cancel
        </Button>
        <Button
          variant={message?.confirmVariant || 'primary'}
          onClick={() => void confirm()}
        >
          Confirm
        </Button>
      </Modal.Footer>
    </Modal>,
    document.body
  );
}
