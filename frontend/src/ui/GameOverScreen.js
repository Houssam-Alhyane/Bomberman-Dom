import { h, render, patch } from '../../framework/src/index.js';

// the box that shows when the match is over
export default class GameOverScreen {
  constructor(container, { onLeave } = {}) {
    this.container = container;
    this.onLeave = onLeave;
    this.old = null;
    this.node = null;
    this.winner = null;
  }

  // remember the winner, draw the box and show it
  show(winner = null) {
    this.winner = winner;
    this.render();
    this.container.classList.remove('hidden');
  }

  // hide the box again
  hide() {
    this.container.classList.add('hidden');
  }

  // draw the box, naming the winner or just saying the match finished
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
    // patch when we already drew once, otherwise render fresh
    this.node = this.old ? patch(this.old, next, this.node) : render(next, this.container);
    this.old = next;
  }
}
