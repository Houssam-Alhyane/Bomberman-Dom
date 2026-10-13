import WebSocketClient from './src/network/WebSocketClient.js';
import NicknameScreen from './src/ui/NicknameScreen.js';
import LobbyScreen from './src/ui/LobbyScreen.js';
import ChatScreen from './src/ui/ChatScreen.js';
import Lobby from './src/network/Lobby.js';
import Rooms from './src/network/Rooms.js';
import Chat from './src/network/Chat.js';

const client = new WebSocketClient();

//the menu + room list: buttons call into Rooms, Rooms talks to the server
const lobbyScreen = new LobbyScreen({
  onHost: () => rooms.host(),
  onJoin: (roomId) => rooms.join(roomId),
  onLeave: () => rooms.leave(),
});

//chat: the network layer validates and sends, the screen renders the widget.
//onMessage/onError are wired before chatScreen exists, hence the optional calls.
let chatScreen;
const chat = new Chat({
  client,
  onMessage: (entry) => chatScreen?.addMessage(entry),
  onError: (text) => chatScreen?.setError(text),
});

chatScreen = new ChatScreen({ chat });

//the screen only reports the typed nickname, Lobby decides if it can be sent
const nicknameScreen = new NicknameScreen({
  onSubmit: (nickname) => lobby.submit(nickname),
});

const lobby = new Lobby({
  client,
  screen: nicknameScreen,
  onJoined: (player) => {
    lobbyScreen.show(player);
    chat.setSelfId(player.id); //so our own messages are marked
    chatScreen.show();
  },
});

const rooms = new Rooms({
  client,
  screen: lobbyScreen,
  onRoomJoined: ({ room }) => console.log(`Entered ${room.name}`),
  //chat is only open while a game is actually running
  onGameState: (gameState) => chatScreen.setLocked(gameState?.state !== 'playing'),
});

client.connect();
