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
let rooms = null;
let nicknameFlow = null;
let matchHandlers = []; // unsubscribe functions for the active match's WebSocket events

const nickname = new NicknameScreen({
  onSubmit: (value) => nicknameFlow.submit(value),
});

const gameScreen = new GameScreen(root, { onLeave: () => leaveGame() });
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

const lobby = new LobbyScreen({
  onHost: () => rooms?.host(),
  onJoin: (roomId) => rooms?.join(roomId),
  onLeave: () => rooms?.leave(),
});

nicknameFlow = new Lobby({
  client,
  screen: nickname,
  onJoined: (player) => {
    me = player;
    nickname.hide();
    lobby.show(player);
  },
});

rooms = new Rooms({
  client,
  screen: lobby,
  onRoomJoined: ({ room }) => console.log(`Entered ${room.name}`),
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

// Local moves go to the server; remote moves are bound per match in startMatch.
engine.onMove = (player) => client.send({ type: 'move', x: player.x, y: player.y });
engine.onStats = (stats) => hud.update({ fps: stats.fps, frameTime: stats.frameTime });
// Lives and alive flags change while the match runs.
engine.onPlayers = (players) => hud.update({ players });
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
// Leaving a room returns to the lobby; a dropped socket falls back to the
// nickname screen (returnToLobby picks whichever is safe).
client.on(SERVER_EVENTS.LEFT_ROOM, () => returnToLobby());
client.on(CONNECTION_EVENTS.CLOSE, () => returnToLobby());

function startMatch(msg) {
  detachMatchHandlers();

  lobby.hide();
  nickname.hide();
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

  // Remote moves only matter while this match is live, so bind them per match.
  // Our own move comes back too, so we ignore it to avoid rubber-banding.
  matchHandlers.push(
    client.on(SERVER_EVENTS.PLAYER_MOVED, (m) => {
      if (m.playerId !== me.id) engine.setPlayerPosition(m.playerId, m.x, m.y);
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

