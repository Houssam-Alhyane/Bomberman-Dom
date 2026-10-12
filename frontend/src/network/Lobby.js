import {
  CLIENT_EVENTS,
  SERVER_EVENTS,
  CONNECTION_EVENTS,
} from '../shared/events.js';

const MIN_NICKNAME_LENGTH = 3;
const MAX_NICKNAME_LENGTH = 20;

//nickname step: checks the nickname, sends join, and remembers who we are
export default class Lobby {
  constructor({ client, screen, onJoined }) {
    this.client = client;
    this.screen = screen;
    this.onJoined = onJoined;

    this.player = null; //{ id, nickname } once the server accepts us
    this.joining = false; //true while we wait for the server's answer

    client.on(CONNECTION_EVENTS.OPEN, () => this.onOpen());
    client.on(CONNECTION_EVENTS.CLOSE, () => this.onClose());
    client.on(SERVER_EVENTS.JOINED, (msg) => this.onJoinedMessage(msg));
    client.on(SERVER_EVENTS.ERROR, (msg) => this.onError(msg));
  }

  //called when the socket connects, we can now send messages to the server
  onOpen() {
    this.screen.setEnabled(true);
    this.screen.setStatus('Connected - enter a nickname');
    this.screen.clearError();
    this.screen.focus();
  }

  //the server removes the player when the connection closes, so there is nothing to resume
  onClose() {
    this.joining = false;
    this.player = null;

    this.screen.show();
    this.screen.setEnabled(false);//remove the input so the player cannot try to join again
    this.screen.clearError();
    this.screen.setStatus('Disconnected - refresh the page to play again');
  }

  //the server accepted our join, we are now a player in the lobby
  onJoinedMessage(msg) {
    this.joining = false;
    this.player = { id: msg.playerId, nickname: msg.nickname };

    this.screen.setStatus(`Joined as ${msg.nickname}`);
    this.screen.hide();

    //Callback to the main app, which will show the lobby and chat screens
    this.onJoined?.(this.player);
  }

  //only errors that answer our join belong on this screen
  onError(msg) {
    if (!this.joining) return;

    this.joining = false;

    this.screen.setEnabled(true);
    this.screen.setStatus('Enter a nickname');
    this.screen.setError(msg.message || 'Could not join the lobby');
    this.screen.focus();
  }

    //called by the screen when the player presses enter or clicks submit
  submit(nickname) {
    if (this.joining) return;

    const problem = this.validate(nickname);

    if (problem) {
      this.screen.setError(problem);
      this.screen.focus();
      return;
    }

    if (!this.client.send({ type: CLIENT_EVENTS.JOIN, nickname })) {
      this.screen.setError('Not connected to the server');
      return;
    }

    this.screen.clearError();
    this.screen.setStatus('Joining...');
    this.screen.setEnabled(false);
    this.joining = true;
  }

  //check nickname
  validate(nickname) {
    if (!nickname) return 'Nickname is required';

    if (
      nickname.length < MIN_NICKNAME_LENGTH ||
      nickname.length > MAX_NICKNAME_LENGTH
    ) {
      return `Nickname must be between ${MIN_NICKNAME_LENGTH} and ${MAX_NICKNAME_LENGTH} characters`;
    }

    return null;
  }
}
