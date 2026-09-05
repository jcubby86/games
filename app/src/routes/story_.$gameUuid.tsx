import { queryOptions, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Col, Container, ListGroup, Row } from 'react-bootstrap';

import Glitch from '../components/Glitch';
import RecreateButton from '../components/RecreateButton';
import ShareButton from '../components/ShareButton';
import { useDocumentTitle } from '../contexts/AppContext';
import { getStoryEntries } from '../utils/apiClient';
import { StoryVariant } from '../utils/gameVariants';

function storyEntriesQueryOptions(gameUuid: string) {
  return queryOptions({
    queryKey: ['games', { uuid: gameUuid }, 'story-entries'],
    queryFn: async () => {
      const response = await getStoryEntries(gameUuid);
      return response.data;
    },
    staleTime: Infinity
  });
}

export const Route = createFileRoute('/story_/$gameUuid')({
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(
        storyEntriesQueryOptions(params.gameUuid)
      );
    } catch {
      // let the component's own useQuery surface the error state
    }
  },
  component: RouteComponent
});

function RouteComponent() {
  useDocumentTitle(StoryVariant.title);
  const { gameUuid } = Route.useParams();
  const storyQuery = useQuery(storyEntriesQueryOptions(gameUuid));

  const stories = storyQuery.data;

  return (
    <Container fluid>
      <Row>
        <Col>
          <Glitch size="sm" text={StoryVariant.title} className="my-3" />
        </Col>
      </Row>
      <Row>
        <Col>
          <ListGroup>
            {stories?.map((item) => (
              <ListGroup.Item
                key={item.player.uuid}
                className="text-break px-3"
              >
                <h5 className="fw-bold mb-1 text-decoration-underline fs-6">
                  {item.player.nickname}
                </h5>
                <p>{item.story}</p>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Col>
      </Row>

      <Row>
        <RecreateButton className="col" to="/story" />
        <ShareButton
          className="col"
          path={`/story/${gameUuid}`}
          text="Read my hilarious story!"
        />
      </Row>
    </Container>
  );
}
