import { h, render } from '../../../framework/src/index.js';

// Vnode representation of the animated BOMBERMAN footer.
export function renderFooter() {
  return h('footer', { class: 'app-footer', role: 'contentinfo' }, [
    h('div', { class: 'footer-brand' }, [
      h('span', { class: 'footer-title' }, [
        h('span', { class: 'footer-part-bomb' }, ['BOMB']),
        h('span', { class: 'footer-part-erman' }, ['ERMAN']),
      ]),
      h('span', { class: 'footer-line' }),
    ]),
  ]);
}

// Mounts the footer once into the designated container (defaults to document.body).
export function mountFooter(container = document.body) {
  return render(renderFooter(), container);
}

