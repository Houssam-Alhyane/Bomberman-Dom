import { h, render, patch } from '../../framework/src/index.js';
import { TILE_SIZE, PLAYER_SIZE } from '../world/map/Map.js';

// Classic Bomberman player colors.
const PLAYER_COLORS = ['#e53935', '#1e88e5', '#43a047', '#fdd835'];

// Renders the board with the mini-framework. Static entities use left/top so
// they paint into the board's shared surface; only players use translate3d.
export class Renderer {
  constructor(container) {
    this.container = container;
    this.vnode = null;
    this.domNode = null;

    // Tiles are static, so their vnodes are kept until a block breaks.
    this._tileVNodes = null;
    this._tileCount = null;

    // Direct references so player positions skip the virtual DOM.
    this._playerEls = new Map();
  }

  // Render or patch the current game state.
  render(state) {
    const newVNode = this.buildView(state);

    if (this.domNode) patch(this.vnode, newVNode, this.domNode);
    else this.domNode = render(newVNode, this.container);

    this.vnode = newVNode;
    this.updatePlayerPositions(state.players);
  }

  // state.players is always a Map of Player objects.
  updatePlayerPositions(players) {
    for (const [id, player] of players) {
      const key = String(id);
      let el = this._playerEls.get(key);

      // The element can be recreated after a board rebuild, so check it.
      if (!el || !el.isConnected) {
        el = this.domNode?.querySelector(`[data-pid="${key}"]`);
        if (el) this._playerEls.set(key, el);
      }

      if (el) el.style.transform = `translate3d(${player.x}px, ${player.y}px, 0)`;
    }
  }

  // Build the complete Virtual DOM tree for the game board.
  buildView(state) {
    // Tiles only change when a block is destroyed, so rebuild them only then.
    if (!this._tileVNodes || this._tileCount !== state.map.tiles.length) {
      this._tileVNodes = this.renderTiles(state.map.tiles);
      this._tileCount = state.map.tiles.length;
    }

    return h(
      'div',
      {
        id: 'game-board',
        key: 'board',
        style: `width:${state.map.width * TILE_SIZE}px;height:${state.map.height * TILE_SIZE}px;`,
      },
      [
        ...this._tileVNodes,
        ...this.renderPowerUps(state.powerUps),
        ...this.renderBombs(state.bombs),
        ...this.renderExplosions(state.explosions),
        ...this.renderPlayers(state.players, state.localPlayerId),
      ]
    );
  }

  // Render map tiles — static, built once per block change.
  renderTiles(tiles = []) {
    return tiles.map((tile) =>
      h('div', {
        key: `tile-${tile.x}-${tile.y}`,
        class: `tile ${tile.type}`,
        style: `width:${TILE_SIZE}px;height:${TILE_SIZE}px;left:${tile.x * TILE_SIZE}px;top:${tile.y * TILE_SIZE}px;`,
      })
    );
  }

  // Render power-up items, stored as grid coordinates.
  renderPowerUps(powerUps = []) {
    return powerUps.map((item, index) =>
      h('div', {
        key: `powerup-${item.id ?? index}`,
        class: `powerup ${item.type || ''}`.trim(),
        style: `width:${TILE_SIZE}px;height:${TILE_SIZE}px;left:${item.x * TILE_SIZE}px;top:${item.y * TILE_SIZE}px;`,
      })
    );
  }

  // Render active bombs, stored as grid coordinates.
  renderBombs(bombs = []) {
    return bombs.map((bomb, index) =>
      h('div', {
        key: `bomb-${bomb.id ?? index}`,
        class: 'bomb',
        style: `width:${TILE_SIZE}px;height:${TILE_SIZE}px;left:${bomb.x * TILE_SIZE}px;top:${bomb.y * TILE_SIZE}px;`,
      })
    );
  }

  // Render explosion blasts, stored as grid coordinates.
  renderExplosions(explosions = []) {
    return explosions.map((exp, index) =>
      h('div', {
        key: `exp-${exp.id ?? index}`,
        class: 'explosion',
        style: `width:${TILE_SIZE}px;height:${TILE_SIZE}px;left:${exp.x * TILE_SIZE}px;top:${exp.y * TILE_SIZE}px;`,
      })
    );
  }

  // Render all active players — their position is written after the patch.
  renderPlayers(players, localId) {
    return Array.from(players.values()).map((player, index) => {
      const isDead = !player.alive || player.lives <= 0;
      const isLocal = player.id === localId;
      const color = PLAYER_COLORS[index % PLAYER_COLORS.length];

      return h('div', {
        key: `player-${player.id}`,
        'data-pid': String(player.id),
        class: `player ${isDead ? 'dead' : ''} ${isLocal ? 'local' : ''}`.trim(),
        style: `width:${PLAYER_SIZE}px;height:${PLAYER_SIZE}px;background:${color};`,
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
    this._tileCount = null;
    this._playerEls.clear();
  }
}
