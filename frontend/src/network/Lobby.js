import { CLIENT_EVENTS, SERVER_EVENTS, CONNECTION_EVENTS } from '../shared/events.js';

const MIN_NICKNAME_LENGTH = 3;
const MAX_NICKNAME_LENGTH = 20;

//nickname step of the lobby: validates input, joins over the socket, tracks the local player
export default class Lobby {
  constructor({ client, screen, onJoined }) {
    this.client = client;
    this.screen = screen;
    this.onJoined = onJoined;

    this.player = null;
    this.joining = false;
    this.lastNickname = '';

    client.on(CONNECTION_EVENTS.OPEN, () => this.onOpen());
    client.on(CONNECTION_EVENTS.CLOSE, () => this.onClose());
    client.on(SERVER_EVENTS.JOINED, (msg) => this.onJoinedMessage(msg));
    client.on(SERVER_EVENTS.ERROR, (msg) => this.onError(msg));
  }

  onOpen() {
    this.joining = false;

    this.screen.setValue(this.lastNickname);
    this.screen.setEnabled(true);
    this.screen.setStatus('Connected - enter a nickname');
    this.screen.clearError();
    this.screen.focus();
  }

  //the server drops the player with the socket, so the nickname has to be sent again
  onClose() {
    this.joining = false;
    this.player = null;

    this.screen.setEnabled(false);
    this.screen.clearError();
    this.screen.setStatus('Disconnected - reconnecting...');
  }

  onJoinedMessage(msg) {
    this.joining = false;
    this.player = { id: msg.playerId, nickname: msg.nickname };

    this.screen.setStatus(`Joined as ${msg.nickname}`);
    this.screen.hide();

    this.onJoined?.(this.player);
  }

  onError(msg) {
    if (!this.joining) return;

    this.joining = false;

    this.screen.setEnabled(true);
    this.screen.setStatus('Enter a nickname');
    this.screen.setError(msg.message || 'Could not join the lobby');
    this.screen.focus();
  }

  submit(nickname) {
    if (this.joining) return;

    const problem = this.validate(nickname);

    if (problem) {
      this.screen.setError(problem);
      this.screen.focus();

      return;
    }

    this.screen.clearError();

    const sent = this.client.send({
      type: CLIENT_EVENTS.JOIN,
      nickname,
    });

    if (!sent) {
      this.screen.setError('Not connected to the server');

      return;
    }

    this.lastNickname = nickname;
    this.joining = true;
    this.screen.setStatus('Joining...');
    this.screen.setEnabled(false);
  }

  //same rules as backend/server/sockets/lobby.js, so bad input never costs a round trip
  validate(nickname) {
    if (!nickname) {
      return 'Nickname is required';
    }

    if (
      nickname.length < MIN_NICKNAME_LENGTH ||
      nickname.length > MAX_NICKNAME_LENGTH
    ) {
      return `Nickname must be between ${MIN_NICKNAME_LENGTH} and ${MAX_NICKNAME_LENGTH} characters`;
    }

    return null;
  }
}
