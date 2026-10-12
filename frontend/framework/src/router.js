import { renderNotFound } from './notfound.js';

export function createRouter(defaultRoute = '/', container = null) {
  //store each route and its handler function
  let routes = {};

  //get current path from the url hash
  function getCurrentPath() {
    return window.location.hash.slice(1) || defaultRoute;
  }

  //where the 404 page goes: the container given to createRouter, then #app, then body
  function notFoundTarget() {
    return container || document.getElementById('app') || document.body;
  }

  //notify all listeners of the current path
  function notify() {
    const path = getCurrentPath();
    const handler = routes[path];

    if (handler) {
      handler(path);
    } else {
      renderNotFound(notFoundTarget(), path);
    }
  }

  //when path changes, notify all listeners
  window.addEventListener('hashchange', notify);

  function add(path, handler) {
    routes[path] = handler;
  }

  //navigate to a new path and notify listeners if the path is the same
  function navigate(path) {
    const currentHash = window.location.hash.slice(1);
    if (currentHash === path) {
      notify();
    } else {
      window.location.hash = path;
    }
  }

  function start() {
    notify();
  }

  return {
    add: add,
    navigate: navigate,
    start: start,
    getCurrentPath: getCurrentPath,
  };
}
