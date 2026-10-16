import { h } from '../../../framework/src/index.js';

// The three bobbing bombs and the game title sit at the top of both the
// nickname screen and the lobby, so their markup lives here once.
const MASCOTS = ['💣', '💣', '💣'];

export function renderMascots() {
  return h(
    'div',
    { class: 'lobby-mascots' },
    MASCOTS.map((icon, index) =>
      h('span', { class: `bomb bomb-${index + 1}` }, [icon]),
    ),
  );
}

export function renderTitle() {
  return h('h1', { class: 'lobby-title' }, [
    h('span', {}, ['BOMB']),
    h('span', {}, ['ERMAN']),
  ]);
}
