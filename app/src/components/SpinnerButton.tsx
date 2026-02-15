import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { ButtonVariant } from 'react-bootstrap/types';

type SpinnerButtonProps = {
  children: React.ReactNode;
  disabled?: boolean;
  spinner?: boolean;
  variant?: ButtonVariant;
  size?: 'sm' | 'lg';
  className?: string;
  type?: 'reset' | 'button' | 'submit' | undefined;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

export const SpinnerButton = ({
  children,
  disabled = false,
  spinner = true,
  variant,
  size,
  className,
  type,
  onClick
}: SpinnerButtonProps) => {
  return (
    <Button
      disabled={disabled}
      variant={variant}
      size={size}
      className={className}
      onClick={onClick}
      type={type}
    >
      {children}{' '}
      {disabled && spinner && (
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
