import WebSocketClient from './src/network/WebSocketClient.js';
import NicknameScreen from './src/ui/NicknameScreen.js';
import LobbyScreen from './src/ui/LobbyScreen.js';
import Lobby from './src/network/Lobby.js';
import Rooms from './src/network/Rooms.js';
import Chat from './src/network/Chat.js';

const client = new WebSocketClient();

//chat starts locked and only unlocks while a game is playing
const chat = new Chat({ client });

//the menu + room list: buttons call into Rooms, Rooms talks to the server
const lobbyScreen = new LobbyScreen({
  onHost: () => rooms.host(),
  onJoin: (roomId) => rooms.join(roomId),
  onLeave: () => rooms.leave(),
});

//the screen only reports the typed nickname, Lobby decides if it can be sent
const nicknameScreen = new NicknameScreen({
  onSubmit: (nickname) => lobby.submit(nickname),
});

const lobby = new Lobby({
  client,
  screen: nicknameScreen,
  onJoined: (player) => {
    chat.setSelfId(player.id);
    lobbyScreen.show(player);
  },
});

const rooms = new Rooms({
  client,
  screen: lobbyScreen,
  onRoomJoined: ({ room }) => console.log(`Entered ${room.name}`),
  //unlock chat while the game runs, and lock it again when we leave (the
  //server/room sends null) - Rooms emits the room's game state on every change
  onGameState: (gs) => chat.setLocked(gs?.state !== 'playing'),
  //in-game errors (chat, moves) go to the chat output, not the lobby screen
  onError: (message) => chat.onError?.(message),
});

client.connect();
