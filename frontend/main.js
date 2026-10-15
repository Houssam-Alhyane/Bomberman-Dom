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

let me = { id: null, nickname: '' };
let chat = null;
let rooms = null;
let nicknameFlow = null;

const nickname = new NicknameScreen({
  onSubmit: (value) => nicknameFlow.submit(value),
});

const gameScreen = new GameScreen(root);
const hud = new HUD(gameScreen.hud);
const chatBox = new ChatBox(gameScreen.chat, { onSend: (text) => chat?.send(text) });
const gameOver = new GameOverScreen(gameScreen.gameOver, { onLeave: () => rooms?.leave() });

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

// Local moves go to the server, remote moves come back and update the board.
engine.onMove = (player) => client.send({ type: 'move', x: player.x, y: player.y });
client.on(SERVER_EVENTS.PLAYER_MOVED, (msg) =>
  engine.setPlayerPosition(msg.playerId, msg.x, msg.y)
);

// The server rejected a move and sent its authoritative position: snap back.
client.on(SERVER_EVENTS.ERROR, (msg) => {
  if (typeof msg.x === 'number' && typeof msg.y === 'number') {
    engine.setPlayerPosition(me.id, msg.x, msg.y);
  }
});

client.on(SERVER_EVENTS.START, (msg) => startMatch(msg));
client.on(SERVER_EVENTS.LEFT_ROOM, () => {
  backToLobby();
  lobby.show(me); // reveal the lobby again after leaving a room
});
client.on(CONNECTION_EVENTS.CLOSE, () => backToLobby());

function startMatch(msg) {
  lobby.hide();
  nickname.hide();
  gameScreen.show();
  chatBox.show();

  chat.setSelfId(me.id);
  chat.setLocked(false);

  // The server sends the shared map so every client renders the same board.
  engine.init(gameScreen.board, {
    localPlayerId: me.id,
    players: msg.players,
    map: msg.map,
  });
  engine.start();

  hud.update({
    players: [...engine.state.players.values()],
    localPlayerId: me.id,
  });
}

function backToLobby() {
  engine.destroy();
  chat.setLocked(true);
  chatBox.hide();
  gameOver.hide();
  gameScreen.hide();
}

client.connect();

