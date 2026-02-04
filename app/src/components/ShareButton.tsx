import Icon from './Icon';
import { logError } from '../utils/errorHandler';

interface ShareProps {
  path: string;
  title?: string;
  text?: string;
  className?: string;
}

const ShareButton = ({
  className,
  path,
  title,
  text
}: ShareProps): JSX.Element => {
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
      <button
        onClick={(e) => {
          e.preventDefault();
          share();
        }}
        className={className}
      >
        <Icon icon="nf-fa-share_square_o" />
      </button>
    );
  } else {
    return <></>;
  }
};

export default ShareButton;
