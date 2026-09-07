import { useNavigate } from '@tanstack/react-router';
import { Button } from 'react-bootstrap';
import { ButtonVariant } from 'react-bootstrap/types';

type LinkButtonProps = {
  children: React.ReactNode;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: 'sm' | 'lg';
  className?: string;
  to: string;
};

export const LinkButton = ({
  children,
  variant,
  size,
  className,
  to
}: LinkButtonProps) => {
  const navigate = useNavigate();

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void navigate({ to: to as any });
      }}
    >
      {children}
    </Button>
  );
};
