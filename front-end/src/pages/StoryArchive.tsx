import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import RecreateButton from '../components/RecreateButton';
import ShareButton from '../components/ShareButton';
import { useApiClient } from '../hooks/useApiClient';
import { StoryVariant } from '../utils/gameVariants';
import { StoryArchiveDto } from '../utils/types';

export default function StoryArchive(): JSX.Element {
  const { getStoryArchive } = useApiClient();
  const { gameUuid } = useParams();
  const [stories, setStories] = useState<StoryArchiveDto[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchStories() {
      const stories = await getStoryArchive(gameUuid!, controller);
      setStories(stories);
    }

    fetchStories();
    return () => controller.abort();
  }, [gameUuid, getStoryArchive]);

  const Items = (): JSX.Element => {
    return (
      <>
        {stories?.map((item) => {
          return <ListItem key={item.player.uuid} item={item} />;
        })}
      </>
    );
  };

  const ListItem = ({ item }: { item: StoryArchiveDto }): JSX.Element => {
    return (
      <li id={item.player.uuid} className="list-group-item bg-light text-break">
        <div className="ms-2 me-auto">
          <p className="fw-bold mb-1">{item.player.nickname}</p>
          <p>{item.story}</p>
        </div>
      </li>
    );
  };

  return (
    <div className="d-flex flex-column w-100">
      <div className="text-center">
        <h1 className="text-nowrap">{StoryVariant.title}</h1>
      </div>

      <ul className="list-group list-group-flush my-3 w-100">
        <Items />
      </ul>
      <div className="container-fluid">
        <div className="row gap-4">
          <RecreateButton className="btn btn-outline-success col" to="/story" />
          <ShareButton
            className="btn col-2"
            path={`/story/${gameUuid}`}
            title={'Games: ' + StoryVariant.title}
            text="Read my hilarious story!"
          />
        </div>
      </div>
    </div>
  );
}
