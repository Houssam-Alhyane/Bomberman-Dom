import { render, patch, State } from '../../framework/src/index.js';
import { renderLobby } from './LobbyView.js';

//lobby logic: owns the State and the public API, wires events, and patches the DOM.
//all rendering lives in LobbyView, which is pure.
export default class LobbyScreen {
  constructor({ onHost, onJoin, onLeave, onGlobalChat } = {}) {
    this.onHost = onHost;
    this.onJoin = onJoin;
    this.onLeave = onLeave;
    this.onGlobalChat = onGlobalChat;

    this.root = document.getElementById('app');

    this.state = new State({
      visible: false,
      view: 'menu', // 'menu' | 'join' | 'room'
      nickname: '',
      error: '',
      rooms: [],
      room: null, //public info of the room we are in
      players: [], //players currently in our room
      isHost: false,
      gameState: null, //countdown / state payload for our room
    });

    //handlers the view turns into onClick props, so the view stays pure
    this.handlers = {
      onHost: () => this.onHost?.(),
      onJoin: (roomId) => this.onJoin?.(roomId),
      onLeave: () => this.onLeave?.(),
      onShowJoin: () => this.setView('join'),
      onShowMenu: () => this.setView('menu'),
      onGlobalChat: () => this.onGlobalChat?.(),
    };

    this.oldVNode = null;
    this.domNode = null;

    this.state.onChange(() => this.update());
    this.update();
  }

  //patch is fed a fresh vnode tree each time the state changes
  update() {
    const next = renderLobby(this.state.get(), this.handlers);

    this.domNode =
      this.oldVNode === null
        ? render(next, this.root)
        : patch(this.oldVNode, next, this.domNode);

    this.oldVNode = next;
  }

  setRoom(room, players, isHost, gameState = null) {
    this.set({ view: 'room', room, players, isHost, gameState, error: '' });
  }

  setRooms(rooms) {
    this.set({ rooms: rooms || [] });
  }

  setView(view) {
    this.set({ view, error: '' });
  }

  setError(text) {
    this.set({ error: text });
  }

  clearError() {
    this.setError('');
  }

  show(player) {
    this.set({
      visible: true,
      view: 'menu',
      error: '',
      room: null,
      players: [],
      isHost: false,
      gameState: null,
      nickname: player?.nickname || this.state.get().nickname,
    });
  }

  hide() {
    this.set({ visible: false });
  }

  set(patchState) {
    this.state.set({ ...this.state.get(), ...patchState });
  }
}
