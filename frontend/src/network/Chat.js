import {
  CLIENT_EVENTS,
  SERVER_EVENTS,
  CONNECTION_EVENTS,
} from '../shared/events.js';

//same rules as backend/server/sockets/chat.js, so bad input never costs a round trip
const MAX_MESSAGE_LENGTH = 200;
const HISTORY_LIMIT = 100;

//chat step: validates outgoing messages, keeps a short history of the room, and
//reports each message through onMessage. no DOM, no rendering - the UI owns that.
export default class Chat {
  constructor({ client, onMessage, onError } = {}) {
    this.client = client;
    this.onMessage = onMessage;
    this.onError = onError;

    this.selfId = null; //our player id, so we can mark our own messages
    this.messages = []; //bounded history, never grows without limit
    this.locked = true; //no chatting until the game actually starts

    client.on(SERVER_EVENTS.CHAT, (msg) => this.receive(msg));
    client.on(CONNECTION_EVENTS.CLOSE, () => this.reset());
  }

  //remember who we are (from the Lobby player object)
  setSelfId(playerId) {
    this.selfId = playerId ?? null;
  }

  //the game unlocks chat once it starts, and relocks it when we leave
  setLocked(locked) {
    this.locked = Boolean(locked);
  }

  //returns true when the message was sent
  send(text) {
    if (this.locked) {
      this.onError?.('Chat unlocks when the game starts');
      return false;
    }

    const message = this.clean(text);

    if (!message) {
      this.onError?.('Message cannot be empty');
      return false;
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      this.onError?.(`Message must be at most ${MAX_MESSAGE_LENGTH} characters`);
      return false;
    }

    if (!this.client.send({ type: CLIENT_EVENTS.CHAT, message })) {
      this.onError?.('Not connected to the server');
      return false;
    }

    return true;
  }

  //turn a server payload into a trusted, plain shape; ignore anything malformed
  receive(payload) {
    if (!payload || typeof payload !== 'object') return;

    const message = this.clean(payload.message);
    if (!message) return;

    const playerId = payload.playerId ?? null;

    const entry = {
      playerId,
      nickname: typeof payload.nickname === 'string' ? payload.nickname : '',
      message,
      own: playerId !== null && playerId === this.selfId,
    };

    this.messages.push(entry);
    if (this.messages.length > HISTORY_LIMIT) this.messages.shift();

    this.onMessage?.(entry);
  }

  //only strings have text; trim so whitespace is never a message
  clean(text) {
    return typeof text === 'string' ? text.trim() : '';
  }

  clear() {
    this.messages = [];
  }

  //connection dropped: forget the room's chatter and who we were
  reset() {
    this.clear();
    this.selfId = null;
    this.locked = true;
  }
}
