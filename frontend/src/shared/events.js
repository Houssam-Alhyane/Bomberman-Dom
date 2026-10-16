//message types sent by the client, values must match backend/server/sockets/handlers.js
export const CLIENT_EVENTS = {
  JOIN: 'join',
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  CHAT: 'chat',
  GLOBAL_CHAT: 'global_chat',
  MOVE: 'move',
  PLACE_BOMB: 'place_bomb',
  // powerup_collect and game_over are no longer sent by the client
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
  GLOBAL_CHAT: 'global_chat',
  PLAYER_MOVED: 'player_moved',
  PLAYER_LEFT: 'player_left',
  PLACE_BOMB: 'place_bomb',
  EXPLOSION: 'explosion',
  BLOCK_DESTROYED: 'block_destroyed',
  POWERUP_SPAWN: 'powerup_spawn',
  POWERUP_COLLECTED: 'powerup_collected',
  PLAYER_HIT: 'player_hit',
  GAME_OVER: 'game_over',
};

//connection lifecycle, handled inside WebSocketClient instead of the wire protocol
export const CONNECTION_EVENTS = {
  OPEN: 'open',
  CLOSE: 'close',
};

