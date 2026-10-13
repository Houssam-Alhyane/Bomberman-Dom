import { h, render, patch } from '../../framework/src/index.js';
import { renderLives } from './components/Lives.js';
import { renderPlayerCounter } from './components/PlayerCounter.js';
import { renderCountdown } from './components/Countdown.js';

// Read-only top bar: players and their lives, plus the player count.
export default class HUD {
  constructor(container) {
    this.container = container;
    this.old = null;
    this.node = null;
    this.data = {
      players: [],
      localPlayerId: null,
      maxPlayers: 4,
      countdown: null,
    };
  }

  update(data = {}) {
    this.data = { ...this.data, ...data };
    this.render();
  }

  render() {
    const { players, localPlayerId, maxPlayers, countdown } = this.data;

    const meta = [
      h('span', { class: 'hud-label' }, ['Players']),
      renderPlayerCounter(players.length, maxPlayers),
    ];
    if (countdown != null) meta.push(renderCountdown(countdown));

    const next = h('div', { class: 'hud-inner' }, [
      h(
        'div',
        { class: 'hud-players' },
        players.map((player) =>
          h(
            'div',
            {
              class: `hud-player${player.id === localPlayerId ? ' local' : ''}`,
              key: String(player.id),
            },
            [
              h('span', { class: 'hud-name' }, [player.nickname || 'Player']),
              renderLives(player.lives),
            ]
          )
        )
      ),
      h('div', { class: 'hud-meta' }, meta),
    ]);

    this.node = this.old ? patch(this.old, next, this.node) : render(next, this.container);
    this.old = next;
  }
}
