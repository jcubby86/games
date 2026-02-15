import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import Glitch from '../components/Glitch';
import RecreateButton from '../components/RecreateButton';
import ShareButton from '../components/ShareButton';
import { getStoryEntries } from '../utils/apiClient';
import { StoryVariant } from '../utils/gameVariants';
import { StoryArchiveDto } from '../utils/types';

export default function StoryArchive() {
  const { gameUuid } = useParams();
  const storyQuery = useQuery({
    queryKey: ['games', { uuid: gameUuid }, 'story-entries'],
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
      <li id={item.player.uuid} className="list-group-item text-break">
        <div className="ms-2 me-auto">
          <p className="fw-bold mb-1 text-decoration-underline">
            {item.player.nickname}
          </p>
          <p>{item.story}</p>
        </div>
      </li>
    );
  };

  return (
    <div className="d-flex flex-column w-100">
      <div className="text-center">
        <Glitch text={StoryVariant.title} className="mb-0 glitch-small" />
      </div>

      <ul className="list-group my-3 w-100">
        <Items />
      </ul>
      <div className="container-fluid">
        <div className="row gap-2">
          <RecreateButton
            variant="outline-success"
            className="bg-success-subtle col"
            to="/story"
          />
          <ShareButton
            className="btn col-2 btn-outline-secondary bg-secondary-subtle"
            path={`/story/${gameUuid}`}
            title={'Games: ' + StoryVariant.title}
            text="Read my hilarious story!"
          />
        </div>
      </div>
    </div>
  );
}
