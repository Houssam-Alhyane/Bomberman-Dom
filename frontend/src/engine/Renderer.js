import { h, render, patch } from '../../framework/src/index.js';
import { TILE_SIZE, PLAYER_SIZE } from '../world/map/Map.js';

// Classic Bomberman player colors.
const PLAYER_COLORS = ['#e53935', '#1e88e5', '#43a047', '#fdd835'];

// Renders the game board and entities into the DOM using the mini-framework.
// All moving elements use translate3d() exclusively for GPU-accelerated compositing.
export class Renderer {
  constructor(container) {
    this.container = container;
    this.vnode = null;
    this.domNode = null;

    // Cache: tiles never move, so build their vnodes once.
    this._tileVNodes = null;

    // Direct DOM references for players — bypasses VDOM for the hottest path.
    this._playerEls = new Map();
  }

  // Render or patch the current game state.
  render(state) {
    if (!this.container) return;

    const newVNode = this.buildView(state);

    if (!this.domNode) {
      this.domNode = render(newVNode, this.container);
      this._cachePlayerEls();
    } else {
      patch(this.vnode, newVNode, this.domNode);
      // Fast path: write player transforms directly to DOM, skip VDOM diff.
      this._updatePlayerTransforms(state.players);
    }

    this.vnode = newVNode;
  }

  // Write player positions directly to cached DOM elements (GPU composited).
  _updatePlayerTransforms(players) {
    const list = players instanceof Map ? players : new Map();
    for (const [id, player] of list) {
      const el = this._playerEls.get(id) || this.domNode?.querySelector(`[data-pid="${id}"]`);
      if (el) {
        el.style.transform = `translate3d(${player.x}px,${player.y}px,0)`;
        this._playerEls.set(id, el);
      }
    }
  }

  // Cache player DOM elements after initial render.
  _cachePlayerEls() {
    if (!this.domNode) return;
    this._playerEls.clear();
    for (const el of this.domNode.querySelectorAll('[data-pid]')) {
      this._playerEls.set(el.dataset.pid, el);
    }
  }

  // Build the complete Virtual DOM tree for the game board.
  buildView(state) {
    if (!state || !state.map) {
      return h('div', { id: 'game-board', class: 'hidden', key: 'board' });
    }

    const width = state.map.width * TILE_SIZE;
    const height = state.map.height * TILE_SIZE;

    // Cache tile vnodes — they never change after map generation.
    if (!this._tileVNodes) {
      this._tileVNodes = this.renderTiles(state.map.tiles);
    }

    const children = [
      ...this._tileVNodes,
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

  // Render map tiles — static, built once.
  renderTiles(tiles = []) {
    return tiles.map((tile) =>
      h('div', {
        key: `tile-${tile.x}-${tile.y}`,
        class: `tile ${tile.type}`,
        style: `width:${TILE_SIZE}px;height:${TILE_SIZE}px;transform:translate3d(${tile.x * TILE_SIZE}px,${tile.y * TILE_SIZE}px,0);`,
      })
    );
  }

  // Render power-up items.
  renderPowerUps(powerUps = []) {
    return powerUps.map((item, index) => {
      const x = item.x < 30 ? item.x * TILE_SIZE : item.x;
      const y = item.y < 30 ? item.y * TILE_SIZE : item.y;
      return h('div', {
        key: `powerup-${item.id ?? index}`,
        class: `powerup ${item.type || ''}`.trim(),
        style: `width:${TILE_SIZE}px;height:${TILE_SIZE}px;transform:translate3d(${x}px,${y}px,0);`,
      });
    });
  }

  // Render active bombs.
  renderBombs(bombs = []) {
    return bombs.map((bomb, index) => {
      const x = bomb.x < 30 ? bomb.x * TILE_SIZE : bomb.x;
      const y = bomb.y < 30 ? bomb.y * TILE_SIZE : bomb.y;
      return h('div', {
        key: `bomb-${bomb.id ?? index}`,
        class: 'bomb',
        style: `width:${TILE_SIZE}px;height:${TILE_SIZE}px;transform:translate3d(${x}px,${y}px,0);`,
      });
    });
  }

  // Render explosion blasts.
  renderExplosions(explosions = []) {
    return explosions.map((exp, index) => {
      const x = exp.x < 30 ? exp.x * TILE_SIZE : exp.x;
      const y = exp.y < 30 ? exp.y * TILE_SIZE : exp.y;
      return h('div', {
        key: `exp-${exp.id ?? index}`,
        class: 'explosion',
        style: `width:${TILE_SIZE}px;height:${TILE_SIZE}px;transform:translate3d(${x}px,${y}px,0);`,
      });
    });
  }

  // Render all active players — uses data-pid for direct DOM access.
  renderPlayers(players, localId) {
    const list = players instanceof Map ? Array.from(players.values()) : (players || []);

    return list.map((player, index) => {
      const isDead = !player.alive || player.lives <= 0;
      const isLocal = player.id === localId;
      const color = PLAYER_COLORS[index % PLAYER_COLORS.length];

      return h('div', {
        key: `player-${player.id}`,
        'data-pid': String(player.id),
        class: `player ${isDead ? 'dead' : ''} ${isLocal ? 'local' : ''}`.trim(),
        style: `width:${PLAYER_SIZE}px;height:${PLAYER_SIZE}px;background:${color};transform:translate3d(${player.x}px,${player.y}px,0);`,
      });
    });
  }

  // Remove the board element from the DOM.
  destroy() {
    if (this.domNode) {
      this.domNode.remove();
      this.domNode = null;
      this.vnode = null;
    }
    this._tileVNodes = null;
    this._playerEls.clear();
  }
}
