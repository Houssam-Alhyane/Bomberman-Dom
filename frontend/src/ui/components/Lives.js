import { h } from '../../../framework/src/index.js';

export function renderLives(lives = 0) {
  const count = Math.max(0, lives);
  return h('span', { class: 'lives' }, [count ? '♥'.repeat(count) : '—']);
}
