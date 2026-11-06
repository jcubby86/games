import { Button } from 'react-bootstrap';

import Icon from './Icon';
import { useSuggestionLike } from '../hooks/useSuggestionLike';
import { alertError } from '../utils/errorHandler';

type LikeSuggestionButtonProps = {
  uuid?: string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'lg';
};

const LikeSuggestionButton = ({
  uuid,
  disabled,
  className,
  size,
}: LikeSuggestionButtonProps) => {
  const { liked, like } = useSuggestionLike(uuid);

  return (
    <Button
      variant="outline-danger"
      size={size}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!uuid || liked) {
          return;
        }
        like().catch((err: unknown) => alertError('Error saving like', err));
      }}
      disabled={disabled || !uuid || liked}
      aria-label={liked ? 'Liked' : 'Like this suggestion'}
    >
      <Icon icon={liked ? 'heart-fill' : 'heart'} />
    </Button>
  );
};

export default LikeSuggestionButton;
