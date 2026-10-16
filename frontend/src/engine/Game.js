import { GameLoop } from './GameLoop.js';
import { GameState } from './GameState.js';
import { Performance } from './Performance.js';
import { Renderer } from './Renderer.js';
import { BombManager } from '../gameplay/BombManager.js';
import { Map } from '../world/map/Map.js';
import { PlayerManager } from '../world/player/PlayerManager.js';
import { Input } from '../world/player/playerinput.js';
import { GRID_WIDTH, GRID_HEIGHT } from '../shared/constants.js';
import { SERVER_EVENTS } from '../shared/events.js';

// Authoritative gameplay events from the server.
const SERVER_GAME_EVENTS = [
  SERVER_EVENTS.PLACE_BOMB,
  SERVER_EVENTS.EXPLOSION,
  SERVER_EVENTS.BLOCK_DESTROYED,
  SERVER_EVENTS.POWERUP_SPAWN,
  SERVER_EVENTS.POWERUP_COLLECTED,
  SERVER_EVENTS.PLAYER_HIT,
  SERVER_EVENTS.GAME_OVER,
];

// Coordinates the game engine subsystems and manages lifecycle.
export class GameEngine {
  constructor() {
    this.state = new GameState();
    this.performance = new Performance();
    this.renderer = null;
    this.gameplay = null;
    this.players = new PlayerManager();
    this.input = new Input();
    this.wsClient = null;
    this.chatOpen = false;

    // Callbacks used by the app (main.js).
    this.onMove = null;
    this.onPlayers = null;
    this.onWinner = null;

    this._playersKey = '';
    this._finished = false;
    this._offServer = [];

    // The loop hands us the fixed step time in milliseconds.
    this.loop = new GameLoop(
      (step) => this.update(step),
      () => this.render(),
      this.performance
    );
  }

  init(container, { localPlayerId = 'local', players = [], map = [], wsClient = null } = {}) {
    this.destroy();
    this.state.reset();
    this.state.localPlayerId = localPlayerId;
    if (wsClient) this.wsClient = wsClient;
    // every client renders the exact same board.
    this.state.setMap(new Map(GRID_WIDTH, GRID_HEIGHT, map));

    // the player manager and input).
    this._playersKey = '';
    this._finished = false;

    const list = players.length ? players : [{ id: localPlayerId, nickname: 'Player' }];
    list.forEach((p) => this.addPlayer(p.id, p.nickname, p));

    this.gameplay = new BombManager();
    this.gameplay.onEvent((fact) => this.wsClient?.send(fact));
    this.listenToServer();

    this.renderer = new Renderer(container);
  }

  // Add a player at the next free spawn tile, optionally with server stats.
  addPlayer(id, nickname, serverData) {
    const player = this.players.addPlayer(id, nickname);

    if (player) {
      // Apply server-authoritative stats if provided (lives, speed, bombs, flameRange)
      if (serverData) {
        player.setStats(serverData);
      }
      this.state.players.set(id, player);
    }

    return player;
  }

  // Apply a position sent by the server for a remote player.
  setPlayerPosition(id, x, y) {
    const player = this.state.players.get(id);

    if (player) {
      player.x = x;
      player.y = y;
    }
  }

  // Drop a player who left or disconnected; the renderer removes the sprite.
  removePlayer(id) {
    this.state.players.delete(id);
  }

  // Bombs, power-ups and the result also arrive from the other players.
  listenToServer() {
    this._offServer = SERVER_GAME_EVENTS.map((type) =>
      this.wsClient?.on(type, (msg) => this.gameplay?.applyRemote(msg, this.state))
    ).filter(Boolean);

    const offLeft = this.wsClient?.on(SERVER_EVENTS.PLAYER_LEFT, (msg) => {
      if (msg.playerId !== this.state.localPlayerId) {
        this.removePlayer(msg.playerId);
      }
    });
    if (offLeft) this._offServer.push(offLeft);
  }

  // Start and stop the fixed-step game loop.
  start() {
    this.loop.start();
  }

  stop() {
    this.loop.stop();
  }

  // Runs once per fixed step (60 per second).
  update(step) {
    // Bombs, explosions and damage keep running even while the chat is open.
    this.gameplay?.update(step, this.state, this.state.map);

    if (this.chatOpen || this._finished) return;

    const player = this.state.players.get(this.state.localPlayerId);
    if (!player || !player.alive || !this.state.map) return;

    // A fresh space press places a bomb on the local player's tile.
    if (this.input.consumeBomb()) {
      this.gameplay?.placeBomb(player, this.state);
    }

    const { dx, dy } = this.input.getDirection();
    if (!dx && !dy) return;

    const { x, y } = player;

    // Collision lives in Map.canMoveTo: the renderer only shows this result.
    player.movement(dx, dy, this.state.map);

    if (player.x !== x || player.y !== y) {
      this.onMove?.(player);
    }
  }

  // Render the current game state into the DOM.
  render() {
    this.reportPlayers();
    this.reportWinner();
    this.renderer?.render(this.state);
  }

  // The HUD only needs a new player list when lives or alive flags change.
  reportPlayers() {
    const players = [...this.state.players.values()];
    const key = players.map((p) => `${p.id}:${p.lives}:${p.alive}`).join('|');

    if (key === this._playersKey) return;

    this._playersKey = key;
    this.onPlayers?.(players);
  }

  // One call when the match is decided, by us or by a relayed result.
  reportWinner() {
    if (this._finished || !this.gameplay?.announced) return;

    this._finished = true;
    this.onWinner?.(this.state.winner);
  }

  // Stop the loop, drop the match listeners and remove the board.
  destroy() {
    this.loop.stop();
    this._offServer.forEach((off) => off());
    this._offServer = [];
    this.gameplay = null;
    this.renderer?.destroy();
    this.renderer = null;
    this.players = new PlayerManager();
    this.input.reset();
  }
}
