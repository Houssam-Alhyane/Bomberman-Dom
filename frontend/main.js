import { GameEngine } from './src/engine/Game.js';

const app = document.getElementById('app');

if (!app) {
  console.error('Missing #app container in index.html');
} else {
  const game = new GameEngine();
  game.init(app);
  game.start();

  window.__GAME__ = game; // handy for debugging in the console
}
