import { clsx } from 'clsx';
import { Button } from 'react-bootstrap';

import Icon from './Icon';
import { logError } from '../utils/errorHandler';

interface ShareProps {
  path: string;
  title?: string;
  text?: string;
  className?: string;
}

const ShareButton = ({ className, path, title, text }: ShareProps) => {
  const getUrl = (): string => {
    return `${window.location.origin}${path}`;
  };

  const share = async () => {
    try {
      if (navigator['share']) {
        await navigator.share({
          title: title,
          text: text,
          url: getUrl()
        });
      }
    } catch (err: unknown) {
      logError('There was an error sharing', err);
    }
  };

  if (navigator['share']) {
    return (
      <Button
        variant="outline-info"
        className={clsx(className, 'bg-info-subtle', 'text-info')}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void share();
        }}
        aria-label={title ? `Share ${title}` : 'Share this page'}
      >
        <Icon icon="share-fill" />
      </Button>
    );
  } else {
    return <></>;
  }
};

export default ShareButton;
