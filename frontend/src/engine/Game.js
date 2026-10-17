import { GameLoop } from './GameLoop.js';
import { GameState } from './GameState.js';
import { Performance } from './Performance.js';
import { Renderer } from './Renderer.js';
import { BombManager } from '../gameplay/BombManager.js';
import { PlayerManager } from '../world/player/PlayerManager.js';
import { Input } from '../world/player/playerinput.js';
import { SERVER_EVENTS } from '../shared/events.js';

// connects the client subsystems and manages the match lifecycle
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

    // callbacks that main.js sets
    this.onMove = null;
    this.onPlayers = null;
    this.onWinner = null;

    this._playersKey = '';
    this._finished = false;
    this._offServer = [];
    this._lastMoveTarget = '';

    this.loop = new GameLoop(
      (step) => this.update(step),
      () => this.render(),
      this.performance
    );
  }

  // set up a new match: build the map, spawn players, wire server events
  init(container, { localPlayerId = 'local', players = [], map = [], wsClient = null } = {}) {
    this.destroy();
    this.state.reset();
    this.state.localPlayerId = localPlayerId;
    if (wsClient) this.wsClient = wsClient;
    // The server owns the map and sends only its tiles; the frontend just
    // renders them. No client-side map/collision, no generation.
    this.state.setMap(map);

    this._playersKey = '';
    this._finished = false;
    this._lastMoveTarget = '';

    // drop each player at the next free spawn position
    const list = players.length ? players : [{ id: localPlayerId, nickname: 'Player' }];
    for (const p of list) {
      const player = this.players.addPlayer(p.id, p.nickname);
      if (player) {
        if (p) player.setStats(p);
        this.state.players.set(p.id, player);
      }
    }

    // the BombManager draws bombs and relays our placement requests
    this.gameplay = new BombManager();
    this.gameplay.onEvent((fact) => this.wsClient?.send(fact));
    this.listenToServer();

    this.renderer = new Renderer(container);
  }

  // apply a server position to a remote player
  setPlayerPosition(id, x, y) {
    const player = this.state.players.get(id);
    if (player) {
      player.x = x;
      player.y = y;
    }
  }

  // listen for gameplay events and for players leaving
  listenToServer() {
    const gameEvents = [
      SERVER_EVENTS.PLACE_BOMB,
      SERVER_EVENTS.EXPLOSION,
      SERVER_EVENTS.BLOCK_DESTROYED,
      SERVER_EVENTS.POWERUP_SPAWN,
      SERVER_EVENTS.POWERUP_COLLECTED,
      SERVER_EVENTS.PLAYER_HIT,
      SERVER_EVENTS.GAME_OVER,
    ];

    this._offServer = gameEvents
      .map((type) => this.wsClient?.on(type, (msg) => this.gameplay?.applyRemote(msg, this.state)))
      .filter(Boolean);

    const offLeft = this.wsClient?.on(SERVER_EVENTS.PLAYER_LEFT, (msg) => {
      if (msg.playerId !== this.state.localPlayerId) {
        this.state.players.delete(msg.playerId);
      }
    });
    if (offLeft) this._offServer.push(offLeft);
  }

  start() {
    this.loop.start();
  }

  // runs every fixed step, about 60 times a second
  update(step) {
    this.gameplay?.update(step, this.state, this.state.map);

    if (this.chatOpen || this._finished) return;

    const player = this.state.players.get(this.state.localPlayerId);
    if (!player?.alive || !this.state.map) return;

    if (this.input.consumeBomb()) {
      this.gameplay?.placeBomb(player, this.state);
    }

    const { dx, dy } = this.input.getDirection();
    if (!dx && !dy) return;

    // No local movement or collision here: the backend owns the map and
    // validates every move (sockets/movement.js). We only ask to move; the
    // position changes when the server broadcasts player_moved back (main.js).
    const next = player.nextPosition(dx, dy);
    const target = `${next.x},${next.y}`;
    if (target === this._lastMoveTarget) return;

    this._lastMoveTarget = target;
    this.onMove?.(next.x, next.y);
  }

  // draw the state and tell main.js what changed
  render() {
    this.notifyPlayers();
    this.notifyWinner();
    this.renderer?.render(this.state);
  }

  // tell main.js when lives or alive flags change
  notifyPlayers() {
    const players = [...this.state.players.values()];
    const key = players.map((p) => `${p.id}:${p.lives}:${p.alive}`).join('|');

    if (key !== this._playersKey) {
      this._playersKey = key;
      this.onPlayers?.(players);
    }
  }

  // tell main.js once, when a winner is decided
  notifyWinner() {
    if (this._finished || !this.gameplay?.announced) return;
    this._finished = true;
    this.onWinner?.(this.state.winner);
  }

  // stop everything, drop the listeners and clean up the DOM
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
