import { h, render, patch } from '../../framework/src/index.js';
import { TILE_SIZE, PLAYER_SIZE } from '../world/map/Map.js';
import { GRID_WIDTH, GRID_HEIGHT } from '../shared/constants.js';

const PLAYER_COLORS = ['#e53935', '#1e88e5', '#43a047', '#fdd835'];

// Renders the game board using the mini-framework's virtual DOM.
export class Renderer {
  constructor(container) {
    this.container = container;
    this.vnode = null;
    this.domNode = null;

    // Tile vnodes are cached because they only change when a block breaks.
    this._tileVNodes = null;
    this._tileCount = null;

    // Direct DOM refs for player elements so translate3d skips the vdom.
    this._playerEls = new Map();
  }

  // Render or patch the game board, then update player positions directly.
  render(state) {
    const newVNode = this.buildBoard(state);

    if (this.domNode) patch(this.vnode, newVNode, this.domNode);
    else this.domNode = render(newVNode, this.container);

    this.vnode = newVNode;
    this.updatePlayerPositions(state.players);
  }

  // Build the full vdom tree for the board and all entities.
  buildBoard(state) {
    // `state.map` is the server's tile array.
    const tiles = state.map ?? [];
    if (!this._tileVNodes || this._tileCount !== tiles.length) {
      this._tileVNodes = tiles.map((t) =>
        this.tile(`tile-${t.x}-${t.y}`, `tile ${t.type}`, t.x, t.y)
      );
      this._tileCount = tiles.length;
    }

    return h(
      'div',
      {
        id: 'game-board',
        key: 'board',
        style: `width:${GRID_WIDTH * TILE_SIZE}px;height:${GRID_HEIGHT * TILE_SIZE}px;`,
      },
      [
        ...this._tileVNodes,
        ...state.powerUps.map((p) =>
          this.tile(`powerup-${p.id}`, `powerup ${p.type || ''}`.trim(), p.x, p.y)
        ),
        ...state.bombs.map((b) => this.tile(`bomb-${b.id}`, 'bomb', b.x, b.y)),
        ...state.explosions.map((e) => this.tile(`exp-${e.id}`, 'explosion', e.x, e.y)),
        ...this.buildPlayers(state.players, state.localPlayerId),
      ]
    );
  }

  // Create a vnode for a grid-positioned entity (tile, bomb, explosion, powerup).
  tile(key, className, gridX, gridY) {
    return h('div', {
      key,
      class: className,
      style: `width:${TILE_SIZE}px;height:${TILE_SIZE}px;left:${gridX * TILE_SIZE}px;top:${gridY * TILE_SIZE}px;`,
    });
  }

  // Build player vnodes — position is set via translate3d after the patch.
  buildPlayers(players, localId) {
    return Array.from(players.values()).map((player, index) => {
      const classes = `player ${!player.alive || player.lives <= 0 ? 'dead' : ''} ${player.id === localId ? 'local' : ''}`.trim();
      return h('div', {
        key: `player-${player.id}`,
        'data-pid': String(player.id),
        class: classes,
        style: `width:${PLAYER_SIZE}px;height:${PLAYER_SIZE}px;background:${PLAYER_COLORS[index % PLAYER_COLORS.length]};`,
      });
    });
  }

  // Set player positions directly on the DOM to keep movement smooth.
  updatePlayerPositions(players) {
    for (const [id, player] of players) {
      const key = String(id);
      let el = this._playerEls.get(key);

      if (!el || !el.isConnected) {
        el = this.domNode?.querySelector(`[data-pid="${key}"]`);
        if (el) this._playerEls.set(key, el);
      }

      if (el) el.style.transform = `translate3d(${player.x}px, ${player.y}px, 0)`;
    }
  }

  // Remove the board from the DOM and clear all cached state.
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
