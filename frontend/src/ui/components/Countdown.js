import { h } from '../../../framework/src/index.js';

// Seconds left in a countdown.
export function renderCountdown(seconds) {
  return h('span', { class: 'countdown' }, [`${seconds}s`]);
}
