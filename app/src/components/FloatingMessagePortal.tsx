import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import FloatingMessage from './FloatingMessage';

type Message = {
  id: number;
  children: React.ReactNode;
  duration?: number;
  distance?: number;
  sway?: number;
  className?: string;
};

const listeners: Array<(m: Message) => void> = [];
let idCounter = 0;

export function showFloatingMessage(opts: Omit<Message, 'id'>) {
  const id = ++idCounter;
  const msg: Message = { id, ...opts };
  listeners.forEach((l) => l(msg));
  return id;
}

export function FloatingMessagePortal(): JSX.Element | null {
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
    <div
      ref={containerRef}
      className="float-root"
      style={{} as React.CSSProperties}
    >
      {messages.map((m) => (
        <div
          key={m.id}
          className="float-item"
          style={{ '--float-start': '40px' } as unknown as React.CSSProperties}
        >
          <FloatingMessage
            duration={m.duration}
            distance={m.distance}
            sway={m.sway}
            className={m.className}
            onFinish={() => remove(m.id)}
          >
            {m.children}
          </FloatingMessage>
        </div>
      ))}
    </div>,
    document.body
  );
}
