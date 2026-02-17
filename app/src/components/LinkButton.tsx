import { Button } from 'react-bootstrap';
import { ButtonVariant } from 'react-bootstrap/types';
import { Link } from 'react-router';

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
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      as={Link as any}
      to={to}
      role="button"
    >
      {children}
    </Button>
  );
};
