type IconProps = {
  icon: string;
  className?: string;
};

const Icon = ({ icon, className = '' }: IconProps) => {
  return <i className={`bi bi-${icon} ${className}`}></i>;
};

export default Icon;
