import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Col, Container, FloatingLabel, Form, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

import Glitch from '../components/Glitch';
import { showModal } from '../components/ModalPortal';
import { SpinnerButton } from '../components/SpinnerButton';
import { useAppContext } from '../contexts/AppContext';
import {
  deletePlayer,
  getGameByCode,
  patchPlayer,
  postPlayer
} from '../utils/apiClient';
import { gameCodeLength, nicknameMaxLength } from '../utils/constants';
import { alertError, logError } from '../utils/errorHandler';
import { gameVariants } from '../utils/gameVariants';
import { GameDto } from '../utils/types';

const Join = () => {
  const { context, dispatchContext } = useAppContext();
  const [code, setCode] = useState(context.game?.code.toLowerCase() || null);
  const [nickname, setNickname] = useState(context.player?.nickname || null);
  const navigate = useNavigate();
  const shouldFocusNickname = code?.length === gameCodeLength;

  const gameQuery = useQuery({
    queryKey: ['games', { code }],
    queryFn: async () => {
      const res = await getGameByCode(code!.toUpperCase());
      return res.data;
    },
    enabled: code?.length === 4,
    retry: false,
    staleTime: 300000 // 5 minutes
  });

  const leaveGameMutation = useMutation({
    mutationFn: () => deletePlayer(context.token!, context.player!.uuid),
    onError: (err: unknown) => logError('Error leaving game', err),
    onSettled: () => dispatchContext({ type: 'clear' })
  });

  const updatePlayerMutation = useMutation({
    mutationFn: ({ nickname }: { nickname: string }) =>
      patchPlayer(context.token!, context.player!.uuid, nickname),
    onSuccess: (playerResponse) =>
      dispatchContext({
        type: 'save',
        game: playerResponse.data.game!,
        player: playerResponse.data,
        token: playerResponse.headers['x-auth-token'] as string
      }),
    onError: (err: unknown) => {
      alertError('Error updating nickname', err);
    }
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
    onError: (err: unknown) => {
      alertError('Error joining game', err);
    }
  });

  const mutations = [
    leaveGameMutation,
    updatePlayerMutation,
    createPlayerMutation
  ];

  const leaveGame = () => {
    if (!context.player || !context.token) {
      return;
    }
    showModal({
      title: 'Leave Game',
      body: 'Are you sure you want to leave this game?',
      onConfirm: async () => {
        await leaveGameMutation.mutateAsync();
        setCode(null);
      },
      confirmVariant: 'danger'
    });
  };

  const submit = async () => {
    if (!formEnabled) {
      return;
    }

    const gameType = gameQuery.data?.type.toLowerCase();

    if (
      gameQuery.data.uuid === context.game?.uuid &&
      nickname === context.player?.nickname
    ) {
      await navigate(`/${gameType}`);
    } else if (
      gameQuery.data.uuid === context.game?.uuid &&
      context.player &&
      context.token
    ) {
      await updatePlayerMutation.mutateAsync({ nickname });
      await navigate(`/${gameType}`);
    } else if (context.player && context.token) {
      showModal({
        title: 'Join Game',
        body: 'Are you sure you want to join this game? You will leave your current game.',
        onConfirm: async () => {
          await leaveGameMutation.mutateAsync();
          await createPlayerMutation.mutateAsync({
            game: gameQuery.data,
            nickname
          });
          await navigate(`/${gameType}`);
        },
        confirmVariant: 'success'
      });
    } else {
      await createPlayerMutation.mutateAsync({
        game: gameQuery.data,
        nickname
      });
      await navigate(`/${gameType}`);
    }
  };

  const formEnabled =
    gameQuery.isSuccess && nickname && mutations.every((m) => !m.isPending);
  const gameVariant = gameVariants.find(
    (v) => v.type === gameQuery.data?.type.toLowerCase()
  );
  const title = gameVariant ? gameVariant.title : 'Join Game';

  let buttonLabel = 'Join Game';
  if (
    gameQuery.isSuccess &&
    context.game?.code === gameQuery.data.code &&
    context.player?.nickname === nickname
  ) {
    buttonLabel = 'Return to Game';
  } else if (
    gameQuery.isSuccess &&
    context.game?.code === gameQuery.data.code &&
    nickname
  ) {
    buttonLabel = 'Change Nickname';
  }

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
          <Col className="p-0">
            <Glitch text={title} className="glitch-small" />
          </Col>
        </Row>
        <Row className="gap-2 mt-3">
          <Col className="p-0">
            <FloatingLabel label="Game Code" controlId="codeInput">
              <Form.Control
                type="search"
                autoComplete="off"
                spellCheck="false"
                autoCorrect="off"
                autoCapitalize="off"
                placeholder="Game Code"
                maxLength={gameCodeLength}
                value={code ?? ''}
                autoFocus={!shouldFocusNickname}
                onChange={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCode(e.target.value.toLowerCase());
                }}
                isInvalid={gameQuery.isError}
              />
            </FloatingLabel>
          </Col>

          <Col className="p-0">
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
                autoFocus={shouldFocusNickname}
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                onChange={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setNickname(e.target.value.toLowerCase());
                }}
                isInvalid={nickname === ''}
              />
            </FloatingLabel>
          </Col>
        </Row>
        <Row className="gap-2 mt-3">
          <SpinnerButton
            variant="success"
            disabled={!formEnabled}
            loading={
              createPlayerMutation.isPending || updatePlayerMutation.isPending
            }
            className="col"
            type="submit"
          >
            {buttonLabel}
          </SpinnerButton>
          {context.game && context.player && context.token && (
            <SpinnerButton
              variant="outline-danger"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                leaveGame();
              }}
              disabled={!formEnabled}
              loading={leaveGameMutation.isPending}
              className="col bg-danger-subtle"
            >
              Leave Game
            </SpinnerButton>
          )}
        </Row>
        <Row className="mt-3">
          {gameQuery.isError && (
            <Form.Text className="text-center text-danger col fs-6">
              Game not found
            </Form.Text>
          )}
        </Row>
      </Form>
    </Container>
  );
};

export default Join;
