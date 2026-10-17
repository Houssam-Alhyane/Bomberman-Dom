import { h, render, patch } from '../../framework/src/index.js';
import { TILE_SIZE, PLAYER_SIZE } from '../world/map/Map.js';

// Classic Bomberman player colors
const PLAYER_COLORS = ['#e53935', '#1e88e5', '#43a047', '#fdd835'];

// Renders the board and entities using the virtual DOM mini-framework.
export class Renderer {
  constructor(container) {
    this.container = container;
    this.vnode = null;
    this.domNode = null;

    // Cache tile vnodes (tiles only change when a block is destroyed)
    this._tileVNodes = null;
    this._tileCount = null;

    // Direct DOM references for players to animate smoothly via translate3d
    this._playerEls = new Map();
  }

  // Render or patch the board, then update player positions
  render(state) {
    const newVNode = this.buildBoard(state);

    if (this.domNode) patch(this.vnode, newVNode, this.domNode);
    else this.domNode = render(newVNode, this.container);

    this.vnode = newVNode;
    this.updatePlayerPositions(state.players);
  }

  // Build the virtual DOM tree for the board, tiles, items, and players
  buildBoard(state) {
    // Rebuild tiles only if block count changed
    if (!this._tileVNodes || this._tileCount !== state.map.tiles.length) {
      this._tileVNodes = state.map.tiles.map((t) =>
        this.tile(`tile-${t.x}-${t.y}`, `tile ${t.type}`, t.x, t.y)
      );
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
        ...state.powerUps.map((p) =>
          this.tile(`powerup-${p.id}`, `powerup ${p.type || ''}`.trim(), p.x, p.y)
        ),
        ...state.bombs.map((b) => this.tile(`bomb-${b.id}`, 'bomb', b.x, b.y)),
        ...state.explosions.map((e) => this.tile(`exp-${e.id}`, 'explosion', e.x, e.y)),
        ...this.buildPlayers(state.players, state.localPlayerId),
      ]
    );
  }

  // Helper to create a grid-positioned vnode (tile, bomb, explosion, powerup)
  tile(key, className, gridX, gridY) {
    return h('div', {
      key,
      class: className,
      style: `width:${TILE_SIZE}px;height:${TILE_SIZE}px;left:${gridX * TILE_SIZE}px;top:${gridY * TILE_SIZE}px;`,
    });
  }

  // Build player vnodes (position is applied directly via translate3d)
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

  // Update player positions directly in DOM for smooth 60fps movement
  updatePlayerPositions(players) {
    for (const [id, player] of players) {
      const key = String(id);
      let el = this._playerEls.get(key);

      // Re-find element if board was re-rendered
      if (!el || !el.isConnected) {
        el = this.domNode?.querySelector(`[data-pid="${key}"]`);
        if (el) this._playerEls.set(key, el);
      }

      if (el) el.style.transform = `translate3d(${player.x}px, ${player.y}px, 0)`;
    }
  }

  // Remove board from DOM and reset cached nodes
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
