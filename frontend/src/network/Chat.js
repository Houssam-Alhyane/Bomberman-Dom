import { SERVER_EVENTS, CONNECTION_EVENTS } from '../shared/events.js';

//same rules as backend/server/sockets/chat.js, so bad input never costs a round trip
const MAX_MESSAGE_LENGTH = 200;
const HISTORY_LIMIT = 100;

//chat step: validates outgoing messages, keeps a short history of the room, and
//reports each message through onMessage. no DOM, no rendering - the UI owns that.
//the channel picks which chat we are: room chat (default) or global chat.
export default class Chat {
  constructor({ client, onMessage, onError, channel = SERVER_EVENTS.CHAT, locked = true } = {}) {
    this.client = client;
    this.channel = channel; //message type used for both sending and receiving
    this.onMessage = onMessage;
    this.onError = onError;

    this.selfId = null; //our player id, so we can mark our own messages
    this.messages = []; //store all messages
    this.locked = locked; //room chat waits for the game; global chat is always open
    this.defaultLocked = locked; //lock state to restore when the connection drops

    client.on(channel, (msg) => this.receive(msg));
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

    if (!this.client.send({ type: this.channel, message })) {
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
    //if playerId is not a string or number, ignore the message
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
    this.locked = this.defaultLocked;
  }
}
