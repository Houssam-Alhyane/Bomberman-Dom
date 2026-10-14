//message types sent by the client, values must match backend/server/sockets/handlers.js
export const CLIENT_EVENTS = {
  JOIN: 'join',
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  CHAT: 'chat',
  MOVE: 'move',
  PLACE_BOMB: 'place_bomb',
  POWERUP_COLLECT: 'powerup_collect',
};

//message types received from the server, values must match backend broadcast payloads
export const SERVER_EVENTS = {
  CONNECTED: 'connected',
  JOINED: 'joined',
  ERROR: 'error',
  ROOMS_LIST: 'rooms_list',
  ROOM_STATE: 'room_state',
  ROOM_JOINED: 'room_joined',
  LEFT_ROOM: 'left_room',
  START: 'start',
  CHAT: 'chat',
  PLAYER_MOVED: 'player_moved',
  POWERUP_SPAWN: 'powerup_spawn',
  GAME_OVER: 'game_over',
};

//connection lifecycle, handled inside WebSocketClient instead of the wire protocol
export const CONNECTION_EVENTS = {
  OPEN: 'open',
  CLOSE: 'close',
};
