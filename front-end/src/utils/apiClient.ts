import axios from 'axios';

import { GameDto, PlayerDto, StoryArchiveDto, SuggestionDto } from './types';

export function postGame(type: string) {
  return axios.post<GameDto>('/api/games', {
    type
  });
}

export function getGameByCode(code: string, signal?: AbortSignal) {
  return axios.get<GameDto>(`/api/games?code=${code}`, { signal });
}

export function patchGame(token: string, uuid: string, phase: string) {
  return axios.patch<GameDto>(
    `/api/games/${uuid}`,
    {
      phase
    },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
}

export function postPlayer(gameUuid: string, nickname: string) {
  return axios.post<PlayerDto>(`/api/games/${gameUuid}/players`, {
    nickname
  });
}

export function getPlayer(token: string, uuid: string) {
  return axios.get<PlayerDto>(`/api/players/${uuid}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function patchPlayer(token: string, uuid: string, nickname: string) {
  return axios.patch<PlayerDto>(
    `/api/players/${uuid}`,
    {
      nickname
    },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
}

export function deletePlayer(token: string, uuid: string) {
  return axios.delete('/api/players/' + uuid, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function postNameEntry(token: string, playerUuid: string, name: string) {
  return axios.post(
    `/api/players/${playerUuid}/name-entries`,
    {
      name
    },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
}

export function postStoryEntry(
  token: string,
  playerUuid: string,
  value: string
) {
  return axios.post(
    `/api/players/${playerUuid}/story-entries`,
    {
      value
    },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
}

export function getSuggestions(category: string, quantity: number) {
  return axios.get<SuggestionDto[]>(
    `/api/suggestions?category=${category}&quantity=${quantity}`
  );
}

export function getStoryEntries(gameUuid: string) {
  return axios.get<StoryArchiveDto[]>(`/api/games/${gameUuid}/story-entries`);
}
