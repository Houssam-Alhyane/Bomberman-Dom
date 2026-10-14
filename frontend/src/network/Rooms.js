import {
  CLIENT_EVENTS,
  SERVER_EVENTS,
  CONNECTION_EVENTS,
} from '../shared/events.js';

//room step: host or join a room, and keep the screen in sync with the server
export default class Rooms {
  constructor({ client, screen, onRoomJoined, onGameState, onError } = {}) {
    this.client = client;
    this.screen = screen;
    this.onRoomJoined = onRoomJoined;
    this.onGameState = onGameState;
    this.onErrorHandler = onError;

    this.room = null; //public info of the room we are in
    this.isHost = false;

    client.on(SERVER_EVENTS.ROOMS_LIST, (msg) => this.onRoomsList(msg));
    client.on(SERVER_EVENTS.ROOM_JOINED, (msg) => this.onRoomJoinedMessage(msg));
    client.on(SERVER_EVENTS.ROOM_STATE, (msg) => this.onRoomState(msg));
    client.on(SERVER_EVENTS.LEFT_ROOM, () => this.onLeftRoom());
    client.on(SERVER_EVENTS.ERROR, (msg) => this.onError(msg));
    client.on(CONNECTION_EVENTS.CLOSE, () => this.onClose());
  }

  host() {
    this.screen.clearError();
    this.send({ type: CLIENT_EVENTS.CREATE_ROOM });
  }

  join(roomId) {
    this.screen.clearError();
    this.send({ type: CLIENT_EVENTS.JOIN_ROOM, roomId });
  }

  leave() {
    this.send({ type: CLIENT_EVENTS.LEAVE_ROOM });
  }

  //true when the message was sent, so callers can react to a dead connection
  send(message) {
    if (this.client.send(message)) return true;

    this.screen.setError('Not connected to the server');
    return false;
  }

  onRoomsList(msg) {
    this.screen.setRooms(msg.rooms);
  }

  //the server has accepted our request to join a room, and sent us the room info
  onRoomJoinedMessage(msg) {
    this.room = msg.room;
    this.isHost = msg.isHost;

    this.screen.setRoom(msg.room, msg.playersList, msg.isHost);
    this.emitGameState(msg.gameState || { state: msg.room?.state });

    this.onRoomJoined?.({ room: msg.room, isHost: msg.isHost });
  }

  //the server has sent us the current state and update if players have joined/left
  onRoomState(msg) {
    if (!this.room || (msg.room && msg.room.id !== this.room.id)) return;

    this.room = msg.room || this.room;
    this.screen.setRoom(this.room, msg.players, this.isHost, msg.gameState);
    this.emitGameState(msg.gameState);
  }
  //the server has informed us that we have left the room
  onLeftRoom() {
    this.room = null;
    this.isHost = false;

    this.emitGameState(null);
    this.screen.clearError();
    this.screen.setView('menu');
  }

  //the nickname screen takes over again when the connection drops
  onClose() {
    this.room = null;
    this.isHost = false;

    this.emitGameState(null);
    this.screen.hide();
  }

  //broadcast the room's game state so listeners know if the game has started
  emitGameState(gameState) {
    this.onGameState?.(gameState || null);
  }

  // Room errors (host/join/leave) happen while we are not in a room, so those
  // are the only ones that belong on the lobby screen. Once we are inside a
  // room the server errors come from chat or moves; hand those to the active
  // screen through onError instead of overwriting the lobby UI.
  onError(msg) {
    const message = msg?.message || 'Something went wrong';

    if (this.room) {
      this.onErrorHandler?.(message);
      return;
    }

    this.screen.setError(message);
  }
}
