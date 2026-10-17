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

    // Callbacks set by main.js.
    this.onMove = null;
    this.onPlayers = null;
    this.onWinner = null;

    this._playersKey = '';
    this._finished = false;
    this._offServer = [];

    this.loop = new GameLoop(
      (step) => this.update(step), // gameplay , input , movement
      () => this.render(),
      this.performance
    );
  }

  init(container, { localPlayerId = 'local', players = [], map = [], wsClient = null } = {}) {
    this.destroy(); // stop loop , listeners & clean render , input
    this.state.reset(); // reset state to default value
    this.state.localPlayerId = localPlayerId;
    if (wsClient) this.wsClient = wsClient;

    this.state.setMap(new Map(GRID_WIDTH, GRID_HEIGHT, map)); // set up the map

    this._playersKey = '';
    this._finished = false;

    // Add each player at the next free spawn position.
    const list = players.length ? players : [{ id: localPlayerId, nickname: 'Player' }];
    for (const p of list) {
      const player = this.players.addPlayer(p.id, p.nickname);
      if (player) {
        if (p) player.setStats(p);
        this.state.players.set(p.id, player); // save player to state
      }
    }

    this.gameplay = new BombManager();
    this.gameplay.onEvent((fact) => this.wsClient?.send(fact)); // send event to server
    this.listenToServer(); // save listeners event

    this.renderer = new Renderer(container);
  }

  // update place of player
  setPlayerPosition(id, x, y) {
    const player = this.state.players.get(id);
    if (player) {
      player.x = x;
      player.y = y;
    }
  }

  // Listen for gameplay events and player disconnects from the server.
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
    .map(type =>
        this.wsClient?.on(type, msg => // catch the msg event from server
            this.gameplay?.applyRemote(msg, this.state) // apply the new event to state
        )
    )
    .filter(Boolean); // remove all falsy event

   const offLeft = this.wsClient?.on( // catch event player left
    SERVER_EVENTS.PLAYER_LEFT,
    msg => {
        if (msg.playerId !== this.state.localPlayerId) { // if player left 
            this.state.players.delete(msg.playerId); // delete from state
        }
    }
);
    if (offLeft) this._offServer.push(offLeft);
  }

  start() {
    this.loop.start();
  }

  // Runs every fixed step (~60 times per second).
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

    const prevX = player.x;
    const prevY = player.y;
    player.movement(dx, dy, this.state.map);

    if (player.x !== prevX || player.y !== prevY) {
      this.onMove?.(player);
    }
  }

  // Draw the current state and notify main.js of any changes.
  render() {
    this.notifyPlayers();
    this.notifyWinner();
    this.renderer?.render(this.state);
  }

  // Tell main.js when the player list changes (lives, alive status).
  notifyPlayers() {
    const players = [...this.state.players.values()];
    const key = players.map((p) => `${p.id}:${p.lives}:${p.alive}`).join('|');

    if (key !== this._playersKey) {
      this._playersKey = key;
      this.onPlayers?.(players);
    }
  }

  // Tell main.js once when a winner is decided.
  notifyWinner() {
    if (this._finished || !this.gameplay?.announced) return;
    this._finished = true;
    this.onWinner?.(this.state.winner);
  }

  // Stop everything, remove listeners, and clean up the DOM.
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
