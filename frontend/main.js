import WebSocketClient from './src/network/WebSocketClient.js';
import NicknameScreen from './src/ui/NicknameScreen.js';
import LobbyScreen from './src/ui/LobbyScreen.js';
import Lobby from './src/network/Lobby.js';
import Rooms from './src/network/Rooms.js';

const client = new WebSocketClient();

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
    lobbyScreen.show(player);
  },
});

const rooms = new Rooms({
  client,
  screen: lobbyScreen,
  onRoomJoined: ({ room }) => console.log(`Entered ${room.name}`),
});

client.connect();
