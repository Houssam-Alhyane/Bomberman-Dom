import WebSocketClient from './src/network/WebSocketClient.js';
import Lobby from './src/network/Lobby.js';
import Rooms from './src/network/Rooms.js';
import Chat from './src/network/Chat.js';
import { SERVER_EVENTS, CONNECTION_EVENTS } from './src/shared/events.js';
import NicknameScreen from './src/ui/NicknameScreen.js';
import LobbyScreen from './src/ui/LobbyScreen.js';
import GameScreen from './src/ui/GameScreen.js';
import HUD from './src/ui/HUD.js';
import ChatBox from './src/ui/components/ChatBox.js';
import GameOverScreen from './src/ui/GameOverScreen.js';
import { GameEngine } from './src/engine/Game.js';

const root = document.getElementById('app');

const client = new WebSocketClient();
const engine = new GameEngine();
engine.wsClient = client;

let me = { id: null, nickname: '' };
let chat = null;
let globalChat = null;
let rooms = null;
let nicknameFlow = null;
let matchHandlers = []; // unsubscribe functions for the active match's WebSocket events

const nickname = new NicknameScreen({
  onSubmit: (value) => nicknameFlow.submit(value),
});

// The Leave button handler is assigned below, once the rooms flow exists.
const gameScreen = new GameScreen(root);
const hud = new HUD(gameScreen.hud);
const chatBox = new ChatBox(gameScreen.chat, {
  onSend: (text) => chat?.send(text),
  onToggle: (isOpen) => {
    engine.chatOpen = isOpen;
    if (isOpen) engine.input.reset();
  },
});
gameScreen.onToggleChat = () => chatBox.toggle();
const gameOver = new GameOverScreen(gameScreen.gameOver, { onLeave: () => leaveGame() });

// Global chat lives outside the lobby screen so re-renders never wipe it.
const globalChatBox = new ChatBox(document.getElementById('global-chat'), {
  title: 'Global Chat',
  onSend: (text) => globalChat?.send(text),
});

const lobby = new LobbyScreen({
  onHost: () => rooms?.host(),
  onJoin: (roomId) => rooms?.join(roomId),
  onLeave: () => rooms?.leave(),
  onGlobalChat: () => globalChatBox.toggle(),
});

nicknameFlow = new Lobby({
  client,
  screen: nickname,
  onJoined: (player) => {
    me = player;
    globalChat?.setSelfId(player.id);
    nickname.hide();
    lobby.show(player);
  },
});

rooms = new Rooms({
  client,
  screen: lobby,
  //unlock chat while the game runs, and lock it again when we leave (the
  //server/room sends null) - Rooms emits the room's game state on every change
  onGameState: (gameState) => {
    chat.setLocked(gameState?.state !== 'playing');
    hud.update({ countdown: gameState?.readyTimeLeft || null });
  },
  //in-game errors (chat, moves) go to the chat output, not the lobby screen
  onError: (message) => chat.onError?.(message),
});

// The in-game "Leave" button has to be told what to do.
gameScreen.onLeave = () => rooms?.leave();

chat = new Chat({
  client,
  onMessage: (entry) => chatBox.add(entry),
  onError: (text) => chatBox.setError(text),
});

// Global chat is always open (no room, no game needed).
globalChat = new Chat({
  client,
  channel: SERVER_EVENTS.GLOBAL_CHAT,
  locked: false,
  onMessage: (entry) => globalChatBox.add(entry),
  onError: (text) => globalChatBox.setError(text),
});


engine.onMove = (x, y) => client.send({ type: 'move', x, y });
// Lives and alive flags change while the match runs.
engine.onPlayers = (players) => {
  hud.update({ players });

  // our own hearts ran out: say so at the top of the screen
  const local = players.find((p) => p.id === me.id);
  if (local && local.lives <= 0) gameScreen.showMessage('You Lose');
};
// The engine tells us once when the match is decided.
engine.onWinner = (winnerId) => {
  const winner = engine.state.players.get(winnerId);
  gameOver.show(winner ? winner.nickname : null);
};

// The server rejected a move and sent its authoritative position: snap back.
client.on(SERVER_EVENTS.ERROR, (msg) => {
  if (typeof msg.x === 'number' && typeof msg.y === 'number') {
    engine.setPlayerPosition(me.id, msg.x, msg.y);
  }
});

client.on(SERVER_EVENTS.START, (msg) => startMatch(msg));
// Leaving a room while still connected returns to the lobby.
client.on(SERVER_EVENTS.LEFT_ROOM, () => returnToLobby());
// A dropped socket must not re-open the lobby: network/Lobby.js shows the
// nickname screen in its disconnected state and network/Rooms.js hides the
// lobby, so here we only tear the match down.
client.on(CONNECTION_EVENTS.CLOSE, () => teardownMatch());

function startMatch(msg) {
  detachMatchHandlers();

  globalChatBox.close();
  lobby.hide();
  nickname.hide();
  gameScreen.hideMessage();
  gameScreen.show();

  chat.setSelfId(me.id);
  chat.setLocked(false);

  // The server sends the shared map so every client renders the same board.
  engine.init(gameScreen.board, {
    localPlayerId: me.id,
    players: msg.players,
    map: msg.map,
    wsClient: client,
  });
  engine.start();

  // The server is the single source of truth for position: apply every
  // player_moved, including our own, so we only ever render accepted moves.
  matchHandlers.push(
    client.on(SERVER_EVENTS.PLAYER_MOVED, (m) => {
      engine.setPlayerPosition(m.playerId, m.x, m.y);
    })
  );

  hud.update({
    players: [...engine.state.players.values()],
    localPlayerId: me.id,
  });
}

// Stop listening to the current match's server events.
function detachMatchHandlers() {
  matchHandlers.forEach((off) => off());
  matchHandlers = [];
}

// Stop the game loop, detach match listeners, and hide the game UI.
// Navigation is left to the caller so a dropped socket can go to the nickname
// screen instead of the lobby.
function teardownMatch() {
  engine.destroy();
  detachMatchHandlers();
  chat.setLocked(true);
  chat.clear();
  chatBox.close();
  gameOver.hide();
  gameScreen.hideMessage();
  gameScreen.hide();
}

// Return to a usable screen: never leave the player on a blank/black page.
function returnToLobby() {
  teardownMatch();

  if (me.id) lobby.show(me);
  else nickname.show();
}

// The Leave button: tell the server to release our slot, then go back locally.
function leaveGame() {
  rooms?.leave();
  returnToLobby();
}

client.connect();

