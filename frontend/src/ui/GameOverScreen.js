import { h, render, patch } from '../../framework/src/index.js';

export default class GameOverScreen {
  constructor(container, { onLeave } = {}) {
    this.container = container;
    this.onLeave = onLeave;
    this.old = null;
    this.node = null;
    this.winner = null;
  }
  // show game over box with winner name
  show(winner = null) {
    this.winner = winner;
    this.render();
    this.container.classList.remove('hidden');
  }
  // hide game over screen
  hide() {
    this.container.classList.add('hidden');
  }

  render() {
    const next = h('div', { class: 'game-over-box' }, [
      h('h2', { class: 'game-over-title' }, ['Game Over']),
      h('p', { class: 'game-over-winner' }, [
        this.winner ? `${this.winner} wins!` : 'Match finished',
      ]),
      h(
        'button',
        { class: 'btn btn-primary', type: 'button', onClick: () => this.onLeave?.() },
        ['Back to lobby']
      ),
    ]);
    // if vnode exist make patch , if not render
    this.node = this.old ? patch(this.old, next, this.node) : render(next, this.container);
    this.old = next;
  }
}
