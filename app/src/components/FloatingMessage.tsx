import { useEffect, useRef, useState } from 'react';

type Props = {
  children: React.ReactNode;
  duration?: number;
  /** length for vertical travel, e.g. 60 */
  distance?: number;
  /** max horizontal sway in px (number). Actual offset is random within +/- sway/2 */
  sway?: number;
  className?: string;
  onFinish?: () => void;
};

function calculateSway(maxSway: number) {
  return Math.random() * (maxSway * 2) - maxSway;
}

/**
 * FloatingMessage
 * - Renders the wrapper `.float-up-fade` and an inner `.float-up-fade__inner` element.
 * - Sets `--float-x`, `--float-duration`, and `--float-distance` per instance.
 * - Automatically hides itself when the animation finishes.
 *
 * Example:
 * <FloatingMessage duration={3} distance="-80px">Saved!</FloatingMessage>
 */
export default function FloatingMessage({
  children,
  duration = 5,
  distance = 300,
  sway = 80,
  className = '',
  onFinish
}: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [visible, setVisible] = useState(true);
  const vx = useRef(calculateSway(sway));
  const vy = useRef(calculateSway(sway) - distance);

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
    <span ref={ref} className={`float-up-fade ${className}`}>
      <span className="float-up-fade__inner">{children}</span>
    </span>
  );
}
