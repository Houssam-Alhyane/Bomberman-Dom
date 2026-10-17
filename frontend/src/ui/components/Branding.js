import { h } from '../../../framework/src/index.js';

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
