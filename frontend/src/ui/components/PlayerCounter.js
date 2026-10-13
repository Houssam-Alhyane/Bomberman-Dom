import { h } from '../../../framework/src/index.js';

// Connected players out of the room capacity.
export function renderPlayerCounter(count = 0, max = 4) {
  return h('span', { class: 'hud-value' }, [`${count} / ${max}`]);
}
