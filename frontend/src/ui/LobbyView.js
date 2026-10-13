import { h } from '../../framework/src/index.js';

const MASCOTS = ['💣', '💣', '💣'];

//pure UI: state + handlers in, vnode out. no State, no side effects, no DOM access.
export function renderLobby(state, handlers = {}) {
  return h(
    'section',
    { id: 'lobby-screen', class: state.visible ? 'lobby' : 'lobby hidden' },
    [
      h('div', { class: 'lobby-box' }, [
        renderMascots(),
        renderTitle(),
        renderSubtitle(state),
        renderError(state),
        ...renderBody(state, handlers),
      ]),
    ],
  );
}

function renderMascots() {
  return h(
    'div',
    { class: 'lobby-mascots' },
    MASCOTS.map((icon, index) =>
      h('span', { class: `bomb bomb-${index + 1}` }, [icon]),
    ),
  );
}

function renderTitle() {
  return h('h1', { class: 'lobby-title' }, [
    h('span', {}, ['BOMB']),
    h('span', {}, ['ERMAN']),
  ]);
}

function renderSubtitle(state) {
  const { view, nickname, rooms } = state;

  if (view === 'join') {
    const count = rooms.length;
    return h('div', { class: 'lobby-status' }, [
      count === 1 ? '1 room available' : `${count} rooms available`,
    ]);
  }

  if (view === 'room') {
    return h('div', { class: 'lobby-status' }, ['You are in a room']);
  }

  return h('div', { class: 'lobby-status' }, [
    nickname ? `Playing as ${nickname}` : 'Choose how you want to play',
  ]);
}

function renderError(state) {
  return h(
    'div',
    { id: 'lobby-screen-error', class: 'lobby-error', role: 'alert' },
    [state.error],
  );
}

function renderBody(state, handlers) {
  switch (state.view) {
    case 'join':
      return [renderJoin(state, handlers)];
    case 'room':
      return [renderRoom(state, handlers)];
    default:
      return [renderMenu(handlers)];
  }
}

function renderMenu(handlers) {
  return h('div', { class: 'lobby-menu' }, [
    h(
      'button',
      {
        id: 'host-btn',
        class: 'btn btn-primary btn-block',
        type: 'button',
        onClick: () => handlers.onHost?.(),
      },
      ['Host Game'],
    ),
    h(
      'button',
      {
        id: 'join-game-btn',
        class: 'btn btn-secondary btn-block',
        type: 'button',
        onClick: () => handlers.onShowJoin?.(),
      },
      ['Join Game'],
    ),
  ]);
}

function renderJoin(state, handlers) {
  const hasRooms = state.rooms.length > 0;

  const items = hasRooms
    ? state.rooms.map((room) => renderRoomRow(room, handlers))
    : [h('li', { class: 'rooms-empty', key: 'empty' }, ['No rooms yet - host one!'])];

  return h('div', { class: 'lobby-join' }, [
    h('ul', { id: 'rooms-list', class: 'rooms-list' }, items),
    h(
      'button',
      {
        id: 'back-btn',
        class: 'btn btn-secondary btn-block',
        type: 'button',
        onClick: () => handlers.onShowMenu?.(),
      },
      ['Back'],
    ),
  ]);
}

function renderRoomRow(room, handlers) {
  const joinable = isJoinable(room);

  return h('li', { class: 'room-card', key: String(room.id) }, [
    h('div', { class: 'room-info' }, [
      h('span', { class: 'room-name' }, [room.name]),
      h('span', { class: 'room-host' }, [`Host: ${room.hostNickname || '-'}`]),
    ]),
    h('span', { class: 'room-count' }, [`${room.players}/${room.maxPlayers}`]),
    h(
      'button',
      {
        class: 'btn btn-primary btn-small',
        type: 'button',
        disabled: !joinable,
        onClick: () => handlers.onJoin?.(room.id),
      },
      [joinLabel(room)],
    ),
  ]);
}

function renderRoom(state, handlers) {
  const { room, players, isHost, gameState } = state;

  const playerItems = players.map((player) =>
    h('li', { class: 'room-player', key: String(player.id) }, [
      `${player.nickname}${player.id === room.hostId ? ' (host)' : ''}`,
    ]),
  );

  return h('div', { class: 'lobby-room' }, [
    h('h2', { class: 'room-title' }, [room.name]),
    h('div', { class: 'room-hint' }, [
      isHost ? 'You are the host' : `Host: ${room.hostNickname || '-'}`,
    ]),
    h('div', { class: 'room-state' }, [roomStateText(room, gameState)]),
    h('ul', { class: 'room-players' }, playerItems),
    h(
      'button',
      {
        id: 'leave-room-btn',
        class: 'btn btn-primary btn-block',
        type: 'button',
        onClick: () => handlers.onLeave?.(),
      },
      ['Leave Room'],
    ),
  ]);
}

//derived, read-only helpers: they depend only on the room data passed in
function roomStateText(room, gameState) {
  const stateName = gameState?.state || room.state;

  if (stateName === 'waitCountdown') {
    return `Waiting for players... ${gameState?.waitTimeLeft ?? ''}s`;
  }

  if (stateName === 'startCountdown') {
    return `Game starts in ${gameState?.readyTimeLeft ?? ''}s`;
  }

  if (stateName === 'playing') {
    return 'Game in progress';
  }

  return 'Waiting for players...';
}

function isJoinable(room) {
  const open = room.state === 'waiting' || room.state === 'waitCountdown';
  return open && room.players < room.maxPlayers;
}

function joinLabel(room) {
  if (room.players >= room.maxPlayers) return 'Full';
  if (!isJoinable(room)) return 'Started';
  return 'Join';
}
