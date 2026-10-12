import { h } from './dom/h.js';
import { render } from './dom/render.js';

// builds the "page not found" view as a vnode
function notFoundView(path) {
  return h('div', { class: 'not-found' }, [
    h('h1', {}, ['404']),
    h('p', {}, ['Page not found: ' + path]),
    h('a', { href: '#/' }, ['Go back home']),
  ]);
}

// clears the container and renders the not-found page into it
export function renderNotFound(container, path) {
  container.innerHTML = '';
  render(notFoundView(path), container);
}