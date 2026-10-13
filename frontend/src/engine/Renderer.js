import { h, render, patch } from '../../framework/src/index.js';
import { TILE_SIZE, PLAYER_SIZE } from '../world/map/Map.js';

// Classic Bomberman player colors.
const PLAYER_COLORS = ['#e53935', '#1e88e5', '#43a047', '#fdd835'];

// Renders the game board and entities into the DOM using the mini-framework.
export class Renderer {
  constructor(container) {
    this.container = container;
    this.vnode = null;
    this.domNode = null;
  }

  // Render or patch the current game state.
  render(state) {
    if (!this.container) return;

    const newVNode = this.buildView(state);

    if (!this.domNode) {
      this.domNode = render(newVNode, this.container);
    } else {
      patch(this.vnode, newVNode, this.domNode);
    }

    this.vnode = newVNode;
  }

  // Build the complete Virtual DOM tree for the game board.
  buildView(state) {
    if (!state || !state.map) {
      return h('div', { id: 'game-board', class: 'hidden', key: 'board' });
    }

    const width = state.map.width * TILE_SIZE;
    const height = state.map.height * TILE_SIZE;

    const children = [
      ...this.renderTiles(state.map.tiles),
      ...this.renderPowerUps(state.powerUps),
      ...this.renderBombs(state.bombs),
      ...this.renderExplosions(state.explosions),
      ...this.renderPlayers(state.players, state.localPlayerId),
    ];

    return h(
      'div',
      {
        id: 'game-board',
        key: 'board',
        style: `width:${width}px;height:${height}px;`,
      },
      children
    );
  }
}