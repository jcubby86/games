import { Button, Spinner } from 'react-bootstrap';
import { ButtonVariant } from 'react-bootstrap/types';

type SpinnerButtonProps = {
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  size?: 'sm' | 'lg';
  className?: string;
  type?: 'reset' | 'button' | 'submit' | undefined;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  autofocus?: boolean;
};

export const SpinnerButton = ({
  children,
  disabled = false,
  loading = false,
  variant,
  size,
  className,
  type,
  onClick,
  autofocus
}: SpinnerButtonProps) => {
  return (
    <Button
      disabled={disabled || loading}
      variant={variant}
      size={size}
      className={className}
      onClick={onClick}
      type={type}
      autoFocus={autofocus}
    >
      {children}{' '}
      {loading && (
        <Spinner
          animation="border"
          size="sm"
          as="span"
          role="status"
          aria-hidden="true"
        />
      )}
    </Button>
  );
};
