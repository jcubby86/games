import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import RecreateButton from '../components/RecreateButton';
import ShareButton from '../components/ShareButton';
import { getStoryEntries } from '../utils/apiClient';
import { StoryVariant } from '../utils/gameVariants';
import { StoryArchiveDto } from '../utils/types';

export default function StoryArchive() {
  const { gameUuid } = useParams();
  const storyQuery = useQuery({
    queryKey: ['storyEntries', gameUuid],
    queryFn: async () => {
      const response = await getStoryEntries(gameUuid!);
      return response.data;
    },
    enabled: !!gameUuid,
    staleTime: Infinity
  });

  const stories = storyQuery.data;

  const Items = () => {
    return (
      <>
        {stories?.map((item) => {
          return <ListItem key={item.player.uuid} item={item} />;
        })}
      </>
    );
  };

  const ListItem = ({ item }: { item: StoryArchiveDto }) => {
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
            className="btn col-2 btn-outline-secondary"
            path={`/story/${gameUuid}`}
            title={'Games: ' + StoryVariant.title}
            text="Read my hilarious story!"
          />
        </div>
      </div>
    </div>
  );
}
