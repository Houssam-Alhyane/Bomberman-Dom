import { h, render } from '../../framework/src/index.js';

export default class GameScreen {
  constructor(root = document.getElementById('app'), { onLeave } = {}) {
    this.onLeave = onLeave || null;
    this.node = render(
      h('section', { id: 'game-screen', class: 'game-screen hidden' }, [
        // top message, e.g. "You Lose" once our own hearts run out
        h('div', { id: 'player-status', class: 'player-status hidden' }),
        h('div', { class: 'game-top' }, [
          h('div', { id: 'hud', class: 'hud' }),
          h('div', { class: 'game-top-actions' }, [ // Container l-actions
            h('button', {
              id: 'chat-toggle-btn',
              class: 'btn btn-secondary btn-small',
              type: 'button',
              onClick: () => this.onToggleChat?.(), // Kat-fto7 w t-sdd l-chat
            }, ['Chat']),
            h('button', {
              id: 'leave-game-btn',
              class: 'btn btn-secondary btn-small',
              type: 'button',
              onClick: () => this.onLeave?.(),
            }, ['Leave']),
          ]),
        ]),
        h('div', { id: 'board', class: 'board' }),
        h('div', { id: 'chat', class: 'chat' }),
        h('div', { id: 'game-over', class: 'game-over hidden' }),
      ]),
      root
    );

    this.board = this.node.querySelector('#board');
    this.hud = this.node.querySelector('#hud');
    this.chat = this.node.querySelector('#chat');
    this.gameOver = this.node.querySelector('#game-over');
    this.status = this.node.querySelector('#player-status');
  }

  show() {
    this.node.classList.remove('hidden');
  }

  hide() {
    this.node.classList.add('hidden');
  }

  // show a short message at the very top of the game screen
  showMessage(text) {
    this.status.textContent = text;
    this.status.classList.remove('hidden');
  }

  // hide the top message again
  hideMessage() {
    this.status.textContent = '';
    this.status.classList.add('hidden');
  }
}
