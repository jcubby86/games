import { useMutation } from '@tanstack/react-query';
import { useRef } from 'react';
import { Col, Container, Form, Row } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';

import Icon from '../components/Icon';
import List from '../components/List';
import { showModal } from '../components/ModalPortal';
import PlayerList from '../components/PlayerList';
import RecreateButton from '../components/RecreateButton';
import { SpinnerButton } from '../components/SpinnerButton';
import StartGame from '../components/StartGame';
import { useAppContext } from '../contexts/AppContext';
import { usePlayerQuery } from '../hooks/usePlayerQuery';
import { useSuggestions } from '../hooks/useSuggestions';
import { useUpdateGameMutation } from '../hooks/useUpdateGameMutation';
import { postNameEntry } from '../utils/apiClient';
import { END, JOIN, nameEntryMaxLength, PLAY, READ } from '../utils/constants';
import { alertError } from '../utils/errorHandler';
import { NameVariant } from '../utils/gameVariants';

const Names = () => {
  const { suggestion, nextSuggestion } = useSuggestions({
    initialCategory: 'MALE_NAME,FEMALE_NAME',
    quantity: 10
  });

  const { context } = useAppContext(true);
  const entryRef = useRef<HTMLInputElement>(null);

  const { playerQuery, setPlayerSubmitted } = usePlayerQuery();

  const postNameMutation = useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const response = await postNameEntry(
        context.token!,
        context.player!.uuid,
        name
      );
      return response.data;
    },
    onSuccess: () => {
      entryRef.current!.value = '';
      nextSuggestion();
      setPlayerSubmitted();
    },
    onError: (err: unknown) => alertError('Error saving entry', err)
  });

  const updateGameMutation = useUpdateGameMutation();

  const player = playerQuery.data;
  const game = player?.game;
  const isHost = player?.roles?.includes('host') ?? false;

  if (game?.phase === JOIN) {
    return <StartGame title={NameVariant.title} players={game.players} />;
  } else if (game?.phase === PLAY && player?.canSubmit) {
    const submitEntry = () => {
      if (postNameMutation.isPending) {
        return;
      }
      if (!entryRef.current?.value) {
        showModal({
          title: 'Use Placeholder',
          body: `You haven't entered anything. Do you want to use the placeholder "${suggestion}"?`,
          onConfirm: () =>
            postNameMutation.mutateAsync({
              name: suggestion
            }),
          confirmVariant: 'warning'
        });
        return;
      }

      postNameMutation.mutate({ name: entryRef.current.value });
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
          <h2 className="text-center fw-bold">Enter a name:</h2>
          <Row className="mt-3">
            <Col className="p-0">
              <Form.Control
                size="lg"
                type="search"
                placeholder={suggestion}
                ref={entryRef}
                maxLength={nameEntryMaxLength}
                autoFocus
                className="text-overflow-ellipsis"
              />
            </Col>
          </Row>
          <Row className="mt-3 gap-2">
            <SpinnerButton
              variant="success"
              className="col-10"
              loading={postNameMutation.isPending}
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
              disabled={postNameMutation.isPending}
            >
              <Icon icon="arrow-clockwise" />
            </Button>
          </Row>
        </Form>
      </Container>
    );
  } else if (game?.phase === READ) {
    const sortedEntries = [...player!.entries!].sort((a, b) => {
      return b.order! - a.order!;
    });

    const hideNames = () => {
      showModal({
        title: 'Hide Names',
        body: 'Are you sure you want to hide the names? This will start the next phase of the game.',
        onConfirm: () => updateGameMutation.mutateAsync({ phase: END }),
        confirmVariant: 'danger'
      });
    };

    return (
      <Container fluid>
        <h4 className="text-center">Names:</h4>
        <Row className="mt-3">
          <List
            items={sortedEntries.map((e) => e.name ?? '')}
            className="col p-0"
          />
        </Row>
        {isHost && (
          <Row className="mt-3">
            <SpinnerButton
              variant="danger"
              className="col"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                hideNames();
              }}
              loading={updateGameMutation.isPending}
            >
              Hide Names
            </SpinnerButton>
          </Row>
        )}
      </Container>
    );
  } else if (game?.phase === END) {
    return (
      <Container fluid>
        <h4 className="text-center pb-3">Enjoy the game!</h4>
        <Row>
          <RecreateButton className="col" />
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
            className="col p-0"
          />
        </Row>
      </Container>
    );
  }
};

export default Names;
