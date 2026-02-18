import { clsx } from 'clsx';

type GlitchProps = {
  text: string;
  size?: 'sm';
  className?: string;
};

const Glitch = ({ text, size, className = '' }: GlitchProps) => {
  return (
    <h1
      className={clsx(
        'glitch',
        size && `glitch-${size}`,
        'text-center',
        className
      )}
      style={{ '--glitch-text': `"${text}"` } as React.CSSProperties}
    >
      {text}
    </h1>
  );
};

export default Glitch;
