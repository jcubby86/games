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
  const share = async () => {
    try {
      if (navigator.share) {
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

  const getUrl = (): string => {
    const url =
      document.querySelector<HTMLAnchorElement>('.navbar-brand')?.href + path;
    return url.replace(/([^:]\/)\/+/g, '$1');
  };

  if (navigator['share']) {
    return (
      <Button
        variant="outline-info"
        className={`${className} bg-info-subtle text-info`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void share();
        }}
      >
        <Icon icon="share-fill" />
      </Button>
    );
  } else {
    return <></>;
  }
};

export default ShareButton;
