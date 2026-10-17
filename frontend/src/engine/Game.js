import { GameLoop } from './GameLoop.js';
import { GameState } from './GameState.js';
import { Performance } from './Performance.js';
import { Renderer } from './Renderer.js';
import { BombManager } from '../gameplay/BombManager.js';
import { PlayerManager } from '../world/player/PlayerManager.js';
import { Input } from '../world/player/playerinput.js';
import { SERVER_EVENTS } from '../shared/events.js';

// Coordinates engine subsystems and manages match lifecycle
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

    // Callbacks set by main.js
    this.onMove = null;
    this.onPlayers = null;
    this.onWinner = null;

    this._playersKey = '';
    this._finished = false;
    this._offServer = [];
    this._lastMoveTarget = '';

    // The game loop calls update() at 60fps and render() each frame
    this.loop = new GameLoop(
      (step) => this.update(step),
      () => this.render(),
      this.performance,
    );
  }

  // Set up a new match: reset state, add players, wire server events
  init(
    container,
    { localPlayerId = 'local', players = [], map = [], wsClient = null } = {},
  ) {
    this.destroy();
    this.state.reset();
    this.state.localPlayerId = localPlayerId;
    if (wsClient) this.wsClient = wsClient;

    this.state.setMap(map);

    this._playersKey = '';
    this._finished = false;
    this._lastMoveTarget = '';

    // Add each player at their spawn position
    const list = players.length
      ? players
      : [{ id: localPlayerId, nickname: 'Player' }];
    for (const p of list) {
      const player = this.players.addPlayer(p.id, p.nickname);
      if (player) {
        if (p) player.setStats(p);
        this.state.players.set(p.id, player);
      }
    }

    // BombManager handles bomb display and placement requests
    this.gameplay = new BombManager();
    this.gameplay.onEvent((fact) => this.wsClient?.send(fact));
    this.listenToServer();

    this.renderer = new Renderer(container);
  }

  // Update a remote player's position sent by server
  setPlayerPosition(id, x, y) {
    const player = this.state.players.get(id);
    if (player) {
      player.x = x;
      player.y = y;
    }
  }

  // Listen for authoritative game events and player disconnects
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
      .map((type) =>
        this.wsClient?.on(type, (msg) =>
          this.gameplay?.applyRemote(msg, this.state),
        ),
      )
      .filter(Boolean);

    // Remove disconnected players
    const offLeft = this.wsClient?.on(SERVER_EVENTS.PLAYER_LEFT, (msg) => {
      if (msg.playerId !== this.state.localPlayerId) {
        this.state.players.delete(msg.playerId);
      }
    });
    if (offLeft) this._offServer.push(offLeft);
  }

  // Start the game loop
  start() {
    this.loop.start();
  }

  // Runs on fixed 60fps ticks: update timers and handle local input
  update(step) {
    this.gameplay?.update(step, this.state, this.state.map);

    if (this.chatOpen || this._finished) return;

    const player = this.state.players.get(this.state.localPlayerId);
    if (!player?.alive || !this.state.map) return;

    // Drop bomb on space press
    if (this.input.consumeBomb()) {
      this.gameplay?.placeBomb(player, this.state);
    }

    // Check movement keys (arrows / WASD)
    const { dx, dy } = this.input.getDirection();
    if (!dx && !dy) return;

    // Send intended move to server (prevents sending duplicate coordinates)
    const next = player.nextPosition(dx, dy);
    const target = `${next.x},${next.y}`;
    if (target === this._lastMoveTarget) return;

    this._lastMoveTarget = target;
    this.onMove?.(next.x, next.y);
  }

  // Draw board and notify UI callbacks
  render() {
    this.notifyPlayers();
    this.notifyWinner();
    this.renderer?.render(this.state);
  }

  // Notify HUD when player lives or alive status change
  notifyPlayers() {
    const players = [...this.state.players.values()];
    const key = players.map((p) => `${p.id}:${p.lives}:${p.alive}`).join('|');

    if (key !== this._playersKey) {
      this._playersKey = key;
      this.onPlayers?.(players);
    }
  }

  // Notify UI once when the match winner is decided
  notifyWinner() {
    if (this._finished || !this.gameplay?.announced) return;
    this._finished = true;
    this.onWinner?.(this.state.winner);
  }

  // Stop loop, remove listeners, and clean up DOM
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
