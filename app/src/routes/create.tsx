import { GameDto } from '@games/shared';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Col, Container, FloatingLabel, Form, Row } from 'react-bootstrap';

import Glitch from '../components/Glitch';
import { showModal } from '../components/ModalPortal';
import { SpinnerButton } from '../components/SpinnerButton';
import { useAppContext, useDocumentTitle } from '../contexts/AppContext';
import { useAiSuggestionsSetting } from '../hooks/useAiSuggestionsSetting';
import { deletePlayer, postGame, postPlayer } from '../utils/apiClient';
import { nicknameMaxLength } from '../utils/constants';
import { alertError, logError } from '../utils/errorHandler';
import { gameVariants } from '../utils/gameVariants';

export const Route = createFileRoute('/create')({
  component: RouteComponent
});

function RouteComponent() {
  useDocumentTitle('Create Game');
  const { context, dispatchContext } = useAppContext();
  const { noAi, setNoAi } = useAiSuggestionsSetting();
  const [gameType, setGameType] = useState<string | null>(null);
  const [nickname, setNickname] = useState(context.player?.nickname || null);
  const navigate = useNavigate();

  const leaveGameMutation = useMutation({
    mutationFn: () => deletePlayer(context.token!, context.player!.uuid),
    onError: (err: unknown) => logError('Error leaving game', err),
    onSettled: () => dispatchContext({ type: 'clear' })
  });

  const createGameMutation = useMutation({
    mutationFn: async ({ type }: { type: string }) => postGame(type),
    onError: (err: unknown) => alertError('Error creating game', err)
  });

  const createPlayerMutation = useMutation({
    mutationFn: ({ game, nickname }: { game: GameDto; nickname: string }) =>
      postPlayer(game.uuid, nickname),
    onSuccess: (playerResponse) =>
      dispatchContext({
        type: 'save',
        player: playerResponse.data,
        game: playerResponse.data.game!,
        token: playerResponse.headers['x-auth-token'] as string
      }),
    onError: (err: unknown) => alertError('Error creating player', err)
  });

  const mutations = [
    leaveGameMutation,
    createGameMutation,
    createPlayerMutation
  ];

  const submit = async () => {
    if (!formEnabled) {
      return;
    }
    if (!gameVariants.map((t) => t.type).includes(gameType)) {
      alertError('Please select a game type', {});
      return;
    }

    if (context.game && context.player && context.token) {
      showModal({
        title: 'Create Game',
        body: 'Are you sure you want to create a new game? You will leave your current game.',
        onConfirm: async () => {
          const gameResponse = await createGameMutation.mutateAsync({
            type: gameType.toUpperCase()
          });
          await leaveGameMutation.mutateAsync();
          await createPlayerMutation.mutateAsync({
            game: gameResponse.data,
            nickname
          });
          await navigate({ to: `/${gameType}` as any });
        },
        confirmVariant: 'success'
      });
    } else {
      const gameResponse = await createGameMutation.mutateAsync({
        type: gameType.toUpperCase()
      });
      await createPlayerMutation.mutateAsync({
        game: gameResponse.data,
        nickname
      });
      await navigate({ to: `/${gameType}` as any });
    }
  };

  const formEnabled =
    gameType && nickname && mutations.every((m) => !m.isPending);

  return (
    <Container fluid>
      <Form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void submit();
        }}
      >
        <Row>
          <Col>
            <Glitch size="sm" text="Create Game" className="my-3" />
          </Col>
        </Row>
        <Row>
          <Col className="min-width-max-content">
            <FloatingLabel label="Game Variant" controlId="gameVariantInput">
              <Form.Select
                aria-label="select"
                onChange={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setGameType(e.currentTarget.value);
                }}
                isInvalid={gameType === ''}
              >
                <option value="">...</option>
                {gameVariants.map((variant) => (
                  <option key={variant.type} value={variant.type}>
                    {variant.title}
                  </option>
                ))}
              </Form.Select>
            </FloatingLabel>
          </Col>

          <Col>
            <FloatingLabel label="Nickname" controlId="nicknameInput">
              <Form.Control
                type="search"
                autoComplete="off"
                spellCheck="false"
                autoCorrect="off"
                autoCapitalize="off"
                placeholder="Nickname"
                maxLength={nicknameMaxLength}
                value={nickname ?? ''}
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                onChange={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setNickname(e.target.value.toLowerCase());
                }}
                className="text-overflow-ellipsis"
                isInvalid={nickname === ''}
              />
            </FloatingLabel>
          </Col>
        </Row>
        <Row>
          <Col>
            <div className="toggle-row d-flex justify-content-between align-items-center px-3 py-2">
              <Form.Label htmlFor="ai-suggestions-toggle" className="mb-0">
                AI-generated suggestions
              </Form.Label>
              <Form.Check
                type="switch"
                role="switch"
                id="ai-suggestions-toggle"
                className="ai-toggle-switch"
                checked={!noAi}
                onChange={(e) => setNoAi(!e.target.checked)}
              />
            </div>
          </Col>
        </Row>
        <Row>
          <SpinnerButton
            variant="success"
            className="col"
            disabled={!formEnabled}
            loading={mutations.some((m) => m.isPending)}
            type="submit"
          >
            Create Game
          </SpinnerButton>
        </Row>
        {gameType && (
          <Row>
            <Form.Text muted className="text-wrap col fs-6">
              {gameVariants.find((v) => v.type === gameType)?.description}
            </Form.Text>
          </Row>
        )}
      </Form>
    </Container>
  );
}
