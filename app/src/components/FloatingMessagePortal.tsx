import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Message = {
  id: number;
  children: React.ReactNode;
  duration?: number;
  sway?: number;
  className?: string;
  onFinish?: () => void;
};

const listeners: Array<(m: Message) => void> = [];
let idCounter = 0;

export function showFloatingMessage(opts: Omit<Message, 'id' | 'onFinish'>) {
  const id = ++idCounter;
  const msg: Message = { id, ...opts };
  listeners.forEach((l) => l(msg));
  return id;
}

function calculateSway(maxSway: number) {
  return Math.random() * (maxSway * 2) - maxSway;
}

function FloatingMessage({
  children,
  duration = 5,
  sway = 80,
  className = '',
  onFinish
}: Omit<Message, 'id'>) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [visible, setVisible] = useState(true);
  const vx = useRef(calculateSway(sway));
  const vy = useRef(calculateSway(sway) - window.innerHeight / 2.5);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.style.setProperty('--float-x', `${vx.current}px`);
    el.style.setProperty('--float-duration', `${duration}s`);
    el.style.setProperty('--float-distance', `${vy.current}px`);

    const inner = el.querySelector('.float-up-fade__inner');
    const handle = () => {
      setVisible(false);
      onFinish?.();
    };

    inner?.addEventListener('animationend', handle);
    return () => inner?.removeEventListener('animationend', handle);
  }, [duration, onFinish]);

  if (!visible) return null;

  return (
    <span ref={ref} className={clsx('float-up-fade', className)}>
      <span className="float-up-fade__inner no-select border px-1 border-danger-subtle rounded-pill bg-danger-subtle">
        {children}
      </span>
    </span>
  );
}

export function FloatingMessagePortal() {
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
