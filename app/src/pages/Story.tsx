import { useMutation } from '@tanstack/react-query';
import { useRef } from 'react';
import { Col, Container, Form, Row } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import { Link } from 'react-router-dom';

import Icon from '../components/Icon';
import { showModal } from '../components/ModalPortal';
import PlayerList from '../components/PlayerList';
import RecreateButton from '../components/RecreateButton';
import ShareButton from '../components/ShareButton';
import { SpinnerButton } from '../components/SpinnerButton';
import StartGame from '../components/StartGame';
import { useAppContext } from '../contexts/AppContext';
import { usePlayerQuery } from '../hooks/usePlayerQuery';
import { useSuggestions } from '../hooks/useSuggestions';
import { postStoryEntry } from '../utils/apiClient';
import { JOIN, PLAY, READ, storyEntryMaxLength } from '../utils/constants';
import { alertError } from '../utils/errorHandler';
import { StoryVariant } from '../utils/gameVariants';

const categories = [
  'MALE_NAME',
  'FEMALE_NAME',
  'STATEMENT',
  'PRESENT_ACTION',
  'PAST_ACTION'
];

const Story = () => {
  const { suggestion, updateCategory, nextSuggestion } = useSuggestions({
    initialCategory: categories[0],
    quantity: 5,
    prefetchCategories: categories
  });

  const { context } = useAppContext(true);
  const entryRef = useRef<HTMLTextAreaElement>(null);

  const { playerQuery, setPlayerSubmitted } = usePlayerQuery();

  const postStoryMutation = useMutation({
    mutationFn: async ({ value }: { value: string }) => {
      const response = await postStoryEntry(
        context.token!,
        context.player!.uuid,
        value
      );
      return response.data;
    },
    onSuccess: (data) => {
      entryRef.current!.value = '';
      updateCategory(data.hint?.category);
      setPlayerSubmitted();
    },
    onError: (err: unknown) => alertError('Error saving entry', err)
  });

  const player = playerQuery.data;
  const game = player?.game;

  if (game?.phase === JOIN) {
    return <StartGame title={StoryVariant.title} players={game.players} />;
  } else if (game?.phase === PLAY && player?.canSubmit) {
    const submitEntry = () => {
      if (postStoryMutation.isPending) {
        return;
      }
      if (!entryRef.current?.value) {
        showModal({
          title: 'Use Placeholder',
          body: `You haven't entered anything. Do you want to use the placeholder "${suggestion}"?`,
          onConfirm: () =>
            postStoryMutation.mutateAsync({
              value: suggestion
            }),
          confirmVariant: 'warning'
        });
        return;
      }

      postStoryMutation.mutate({
        value: entryRef.current.value
      });
    };

    return (
      <Container fluid>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            submitEntry();
          }}
        >
          <h4 className="text-center fw-bold">{player.entry?.hint?.prompt}</h4>
          <Row>
            <Col className="p-0">
              <Form.Control
                as="textarea"
                placeholder={suggestion}
                ref={entryRef}
                style={{ minHeight: '100px' }}
                maxLength={player.entry?.hint?.limit ?? storyEntryMaxLength}
                autoFocus
              />
            </Col>
          </Row>
          <Row className="mt-3 gap-2">
            <SpinnerButton
              variant="success"
              className="col-9"
              loading={postStoryMutation.isPending}
              type="submit"
            >
              Submit
            </SpinnerButton>
            <Button
              variant="outline-secondary"
              className="col"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                nextSuggestion();
              }}
              disabled={postStoryMutation.isPending}
            >
              <Icon icon="arrow-clockwise" />
            </Button>
          </Row>
        </Form>
      </Container>
    );
  } else if (game?.phase === READ) {
    return (
      <Container fluid>
        <Row>
          <p className="col border rounded bg-white lh-lg fs-6 px-3 py-1 text-break">
            {player?.entry?.story}
          </p>
        </Row>
        <Row className="gap-2">
          <RecreateButton className="col" />
          <Link
            to={`/story/${game.uuid}`}
            className="col btn btn-outline-success bg-success-subtle"
          >
            See all
          </Link>
          <ShareButton
            className="col"
            path={`/story/${game.uuid}`}
            title={StoryVariant.title}
            text="Read my hilarious story!"
          />
        </Row>
      </Container>
    );
  } else {
    return (
      <Container fluid>
        <h4 className="text-center">Waiting for other players...</h4>
        <Row>
          <PlayerList
            players={game?.players?.filter((p) => p.canSubmit)}
            className="col"
          />
        </Row>
      </Container>
    );
  }
};

export default Story;
