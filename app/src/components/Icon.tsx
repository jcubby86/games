import { clsx } from 'clsx';

type IconProps = {
  icon: string;
  className?: string;
};

const Icon = ({ icon, className = '' }: IconProps) => {
  return <i className={clsx(`bi bi-${icon}`, className)}></i>;
};

export default Icon;
