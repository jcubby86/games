import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from 'react-bootstrap';

import Icon from './Icon';
import { postSuggestionLike } from '../utils/apiClient';
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
  size
}: LikeSuggestionButtonProps) => {
  const [liked, setLiked] = useState(false);

  const likeMutation = useMutation({
    mutationFn: () => postSuggestionLike(uuid!),
    onSuccess: () => setLiked(true),
    onError: (err: unknown) => alertError('Error saving like', err)
  });

  return (
    <Button
      variant="outline-danger"
      size={size}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!uuid || liked || likeMutation.isPending) {
          return;
        }
        likeMutation.mutate();
      }}
      disabled={disabled || !uuid || liked || likeMutation.isPending}
      aria-label={liked ? 'Liked' : 'Like this suggestion'}
    >
      <Icon icon={liked ? 'heart-fill' : 'heart'} />
    </Button>
  );
};

export default LikeSuggestionButton;
