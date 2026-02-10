type GlitchProps = {
  text: string;
  className?: string;
};

const Glitch = ({ text, className }: GlitchProps) => {
  return (
    <h1
      className={`glitch ${className || ''}`}
      style={{ '--glitch-text': `"${text}"` } as React.CSSProperties}
    >
      {text}
    </h1>
  );
};

export default Glitch;
