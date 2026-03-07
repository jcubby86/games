import { clsx } from 'clsx';
import { Button } from 'react-bootstrap';

import Icon from './Icon';
import { logError } from '../utils/errorHandler';

interface ShareProps {
  path: string;
  title: string;
  text?: string;
  className?: string;
}

const ShareButton = ({ className, path, title, text }: ShareProps) => {
  const getUrl = (): string => {
    return `${window.location.origin}${path}`;
  };

  const updateOrCreateMetaTag = (property: string, content: string) => {
    let metaTag = document.querySelector(
      `meta[property="${property}"]`
    ) as HTMLMetaElement;
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('property', property);
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', content);
  };

  const updateMetaTags = (title: string, url: string, text?: string) => {
    // Store original values to restore later
    const originalTitle = document.title;

    // Update page title (used by iOS)
    document.title = title;

    updateOrCreateMetaTag('og:title', title);
    updateOrCreateMetaTag('og:url', url);
    if (text) {
      updateOrCreateMetaTag('og:description', text);
    }

    return originalTitle;
  };

  const share = async () => {
    const url = getUrl();
    let originalTitle = '';

    try {
      if (navigator['share']) {
        // Update meta tags before sharing (critical for iOS)
        originalTitle = updateMetaTags(title, url, text);

        await navigator.share({
          title: title,
          text: text,
          url: url
        });
      }
    } catch (err: unknown) {
      logError('There was an error sharing', err);
    } finally {
      // Restore original title after a short delay
      if (originalTitle) {
        setTimeout(() => {
          document.title = originalTitle;
        }, 100);
      }
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
