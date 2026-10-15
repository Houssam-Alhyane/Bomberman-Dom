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
  onGameState: (gameState) => hud.update({ countdown: gameState?.readyTimeLeft || null }),
});

chat = new Chat({
  client,
  onMessage: (entry) => chatBox.add(entry),
  onError: (text) => chatBox.setError(text),
});

// Local moves go to the server; remote moves are bound per match in startMatch.
engine.onMove = (player) => client.send({ type: 'move', x: player.x, y: player.y });
engine.onStats = (stats) => hud.update({ fps: stats.fps, frameTime: stats.frameTime });

client.on(SERVER_EVENTS.START, (msg) => startMatch(msg));
client.on(SERVER_EVENTS.LEFT_ROOM, () => returnToLobby());
client.on(CONNECTION_EVENTS.CLOSE, () => teardownMatch());

function startMatch(msg) {
  detachMatchHandlers();

  lobby.hide();
  nickname.hide();
  gameScreen.show();

  chat.setSelfId(me.id);
  chat.setLocked(false);

  // The server sends the shared seed so every client builds the same map.
  const seed = msg.seed ?? msg.gameState?.seed;

  engine.init(gameScreen.board, {
    localPlayerId: me.id,
    players: msg.players,
    seed,
    wsClient: client,
  });
  engine.start();

  // Remote moves only matter while this match is live, so bind them per match.
  matchHandlers.push(
    client.on(SERVER_EVENTS.PLAYER_MOVED, (m) =>
      engine.setPlayerPosition(m.playerId, m.x, m.y)
    )
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
  engine.onMove = null;
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

// Debug handle.
window.__APP__ = { client, engine, lobby, rooms, chat };
