import { useQuery } from '@tanstack/react-query';
import { Col, Container, ListGroup, Row } from 'react-bootstrap';
import { useParams } from 'react-router-dom';

import Glitch from '../components/Glitch';
import RecreateButton from '../components/RecreateButton';
import ShareButton from '../components/ShareButton';
import { getStoryEntries } from '../utils/apiClient';
import { StoryVariant } from '../utils/gameVariants';

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

  return (
    <Container fluid>
      <Row>
        <Col className="p-0">
          <Glitch size="sm" text={StoryVariant.title} className="my-3" />
        </Col>
      </Row>
      <Row className="mt-3">
        <ListGroup className="col p-0">
          {stories?.map((item) => (
            <ListGroup.Item key={item.player.uuid} className="text-break px-3">
              <h5 className="fw-bold mb-1 text-decoration-underline fs-6">
                {item.player.nickname}
              </h5>
              <p>{item.story}</p>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Row>

      <Row className="gap-2 mt-3">
        <RecreateButton className="col" to="/story" />
        <ShareButton
          className="col"
          path={`/story/${gameUuid}`}
          title={StoryVariant.title}
          text="Read my hilarious story!"
        />
      </Row>
    </Container>
  );
}
