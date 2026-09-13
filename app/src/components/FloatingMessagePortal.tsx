import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import Icon from './Icon';

type Message = {
  id: number;
  duration?: number;
  sway?: number;
  nickname: string;
  color?: string;
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
  duration = 5,
  sway = 80,
  nickname,
  color,
  onFinish,
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
    <span ref={ref} className="float-up-fade">
      <span
        className={clsx(
          'float-up-fade__inner no-select border px-1 rounded-pill text-white',
          color ? '' : 'bg-danger-subtle border-danger-subtle',
        )}
        style={color ? { backgroundColor: color, borderColor: color } : {}}
      >
        {nickname} <Icon icon="hand-index-thumb" />
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
    <div ref={containerRef} className="float-root" style={{}}>
      {messages.map((m) => (
        <div
          key={m.id}
          className="float-item"
          style={{ '--float-start': '40px' } as unknown as React.CSSProperties}
        >
          <FloatingMessage
            onFinish={() => remove(m.id)}
            duration={m.duration}
            sway={m.sway}
            nickname={m.nickname}
            color={m.color}
          />
        </div>
      ))}
    </div>,
    document.body,
  );
}
