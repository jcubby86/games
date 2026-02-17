import { Button } from 'react-bootstrap';
import { ButtonVariant } from 'react-bootstrap/types';
import { Link } from 'react-router';

type LinkButtonProps = {
  children: React.ReactNode;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: 'sm' | 'lg';
  className?: string;
  type?: 'reset' | 'button' | 'submit' | undefined;
  to: string;
};

export const LinkButton = ({
  children,
  disabled = false,
  variant,
  size,
  className,
  type,
  to
}: LinkButtonProps) => {
  return (
    <Button
      disabled={disabled}
      variant={variant}
      size={size}
      className={className}
      type={type}
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      as={Link as any}
      to={to}
    >
      {children}
    </Button>
  );
};
