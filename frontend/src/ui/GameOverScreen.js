import { h, render, patch } from '../../framework/src/index.js';

// End-of-match overlay. Ready for the gameplay module's winner event.
export default class GameOverScreen {
  constructor(container, { onLeave } = {}) {
    this.container = container;
    this.onLeave = onLeave;
    this.old = null;
    this.node = null;
    this.winner = null;
  }

  show(winner = null) {
    this.winner = winner;
    this.render();
    this.container.classList.remove('hidden');
  }

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

    this.node = this.old ? patch(this.old, next, this.node) : render(next, this.container);
    this.old = next;
  }
}
