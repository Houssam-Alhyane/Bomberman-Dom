const MAX_PLAYERS = 4;
const MIN_PLAYERS = 2;
const WAIT_TIMER_DURATION = 20 * 1000; // 20 seconds
const READY_TIMER_DURATION = 10 * 1000; // 10 seconds

// states: waiting -> waitCountdown (20s) -> startCountdown (10s) -> playing
class Room {
  constructor() {
    this.players = [];
    this.maxPlayers = MAX_PLAYERS;
    this.state = 'waiting';

    this.waitTimer = null; // store the timeout id
    this.readyTimer = null;
    this.ticker = null; // emits the state every second while a countdown runs
    this.waitTimerStartedAt = null; //take time now when the timer starts
    this.readyTimerStartedAt = null;

    this.onStateChange = null; // set when the room is created, called when the state changes
    this.onGameStart = null; // set when starting a game, called when the game starts
  }

  get hostId() {
    const host = this.players[0];
    return host ? host.id : null;
  }

  get hostNickname() {
    const host = this.players[0];
    return host ? host.nickname : null;
  }

  // nobody can join a running game or a full room
  canJoin() {
    return this.state !== 'playing' && !this.isFull();
  }

  addPlayer(player) {
    if (!this.canJoin() || this.hasPlayer(player.id)) {
      return false;
    }

    this.players.push(player);
    this.checkStartConditions();
    return true;
  }

  removePlayer(playerId) {
    //take player
    const player = this.players.find((p) => p.id === playerId);

    if (!player) {
      return null;
    }
    //save all players except the one to remove
    this.players = this.players.filter((p) => p.id !== playerId);

    if (this.isEmpty()) {
      this.reset(); // everyone left: fresh room
    } else {
      this.checkStartConditions();
    }

    return player;
  }

  hasPlayer(playerId) {
    return this.players.some((p) => p.id === playerId);
  }

  getPlayerCount() {
    return this.players.length;
  }

  isFull() {
    return this.players.length >= this.maxPlayers;
  }

  isEmpty() {
    return this.players.length === 0;
  }

  clearTimers() {
    clearTimeout(this.waitTimer);
    clearTimeout(this.readyTimer);
    clearInterval(this.ticker);
    this.waitTimer = null;
    this.readyTimer = null;
    this.ticker = null;
  }

  // back to a clean waiting room (timers stopped, state = waiting)
  reset() {
    this.clearTimers();
    this.waitTimerStartedAt = null;
    this.readyTimerStartedAt = null;
    this.state = 'waiting';
    this.emitStateChange();
  }

  // call this when the game is over: removes everybody and resets
  endGame() {
    this.players = [];
    this.reset();
  }

  checkStartConditions() {
    const count = this.getPlayerCount();

    // a running game is not affected by joins or leaves
    if (this.state === 'playing') return;

    // not enough players: cancel any timer
    if (count < MIN_PLAYERS) {
      if (this.state !== 'waiting') this.reset();
      return;
    }

    // the 10s countdown is already running: let it finish
    if (this.state === 'startCountdown') return;

    // 4 players: skip the 20s wait, start the 10s countdown now
    if (count === this.maxPlayers) {
      this.startReadyTimer();
      return;
    }

    // 2 or 3 players: start the 20s wait once
    if (this.state === 'waiting') {
      this.startWaitTimer();
    }
  }

  startWaitTimer() {
    this.clearTimers();
    this.state = 'waitCountdown';
    this.waitTimerStartedAt = Date.now();
    this.readyTimerStartedAt = null;
    this.startTicker();
    this.emitStateChange();

    this.waitTimer = setTimeout(() => {
      this.waitTimer = null;

      if (this.getPlayerCount() >= MIN_PLAYERS) {
        this.startReadyTimer();
      } else {
        this.reset();
      }
    }, WAIT_TIMER_DURATION);
  }

  startReadyTimer() {
    this.clearTimers();
    this.state = 'startCountdown';
    this.waitTimerStartedAt = null;
    this.readyTimerStartedAt = Date.now();
    this.startTicker();
    this.emitStateChange();

    this.readyTimer = setTimeout(() => {
      this.readyTimer = null;
      this.startGame();
    }, READY_TIMER_DURATION);
  }

  startGame() {
    this.clearTimers();
    this.state = 'playing';
    this.emitStateChange();

    if (this.onGameStart) {
      this.onGameStart(this);
    }
  }

  //every second run func getstate
  startTicker() {
    this.ticker = setInterval(() => this.emitStateChange(), 1000);
  }

  // emit the current state to the room's onStateChange callback, if set
  emitStateChange() {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }

  getState() {
    const now = Date.now();
    let waitTimeLeft = 0;
    let readyTimeLeft = 0;

    if (this.state === 'waitCountdown' && this.waitTimerStartedAt) {
      // calculate the remaining time in seconds
      waitTimeLeft = Math.max(
        0,
        Math.ceil(
          (WAIT_TIMER_DURATION - (now - this.waitTimerStartedAt)) / 1000,
        ),
      );
    }

    if (this.state === 'startCountdown' && this.readyTimerStartedAt) {
      readyTimeLeft = Math.max(
        0,
        Math.ceil(
          (READY_TIMER_DURATION - (now - this.readyTimerStartedAt)) / 1000,
        ),
      );
    }

    return {
      state: this.state,
      players: this.getPlayerCount(),
      maxPlayers: this.maxPlayers,
      hostId: this.hostId,
      hostNickname: this.hostNickname,
      waitTimeLeft,
      readyTimeLeft,
    };
  }
  getPublicInfo() {
    return {
      id: this.id,
      name: this.name,
      hostId: this.hostId,
      hostNickname: this.hostNickname,
      players: this.getPlayerCount(),
      maxPlayers: this.maxPlayers,
      state: this.state,
    };
  }
}

module.exports = Room;
