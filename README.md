# Bomberman DOM

A real-time **multiplayer Bomberman** clone that runs entirely in the browser and
renders every entity as a DOM element — no game engine, no canvas, no build step.

The frontend is plain ES modules powered by a small hand-written virtual-DOM
toolkit, and the backend is a Node.js WebSocket server that is **authoritative**:
it owns the map, validates every move, places bombs, resolves explosions, and
decides who wins. Clients only draw what the server tells them.

## Authors

- Erezzoug
- Msarar
- Abouzerd
- Halhyane

## Features

- **2–4 player online matches** — host a room or join one from the lobby.
- **Server-authoritative gameplay** — movement, bombs, damage and the winner are
  all decided on the server, so clients cannot cheat by teleporting, spamming
  bombs, or faking power-ups.
- **Custom virtual-DOM mini-framework** (`frontend/framework`) with `h()`,
  `render()`, `patch()` and a reactive `State`.
- **Exact collision** — players occupy a body of tiles, flames stop at walls and
  blocks, and broken blocks sometimes drop a power-up.
- **Power-ups** — extra bombs, more flame range, and higher speed, each with a cap.
- **Lives / hearts HUD**, countdowns, and a **"You Lose" banner** shown to a player
  whose hearts run out.
- **Room chat** (unlocks once the match starts) and a **global chat** available
  from the lobby at any time.
- **Resilient connections** — ping/pong heartbeat drops dead sockets, and a
  player leaving a running match lets the others keep playing (or ends it).

## Tech Stack

| Layer     | Technology                                                   |
| --------- | ------------------------------------------------------------ |
| Frontend  | Vanilla JavaScript (ES modules), custom mini VDOM, plain CSS |
| Backend   | Node.js, [`ws`](https://github.com/websockets/ws) WebSockets |
| Transport | JSON messages over a WebSocket (`ws://localhost:8080`)       |

No bundler, transpiler, or framework dependencies are used on the frontend.

## Project Structure

```
Bomberman-Dom/
├── backend/
│   ├── server/
│   │   ├── server.js            # HTTP + WebSocket server (port 8080)
│   │   ├── game/                # authoritative game logic
│   │   │   ├── config.js        # tunable rules (lives, timers, caps…)
│   │   │   ├── map.js           # map generation + collision
│   │   │   ├── grid.js          # tile/occupancy/spatial helpers
│   │   │   ├── gameState.js     # per-room state + id generator
│   │   │   ├── gameLoop.js      # one tick: bombs → blasts → flames → pickups → result
│   │   │   ├── detonation.js    # bomb timing, explosions, block drops, damage
│   │   │   ├── explosions.js    # flame lifetime
│   │   │   ├── powerUps.js      # pickups + stat growth
│   │   │   ├── playerStats.js   # default stats, power-up caps, snapshot
│   │   │   ├── finish.js        # win / lose resolution
│   │   │   ├── room.js          # room lifecycle + countdowns
│   │   │   └── roomManager.js   # room registry (capped at 100)
│   │   └── sockets/             # message handling
│   │       ├── connection.js    # per-socket setup + teardown
│   │       ├── message.js       # safe JSON parsing of incoming frames
│   │       ├── handlers.js      # routes each client message type
│   │       ├── state.js         # connected players
│   │       ├── rooms.js         # create/join/leave room
│   │       ├── lobby.js         # nickname validation for joining
│   │       ├── movement.js      # move validation (anti-cheat)
│   │       ├── bombs.js         # bomb placement validation
│   │       ├── chat.js          # room + global chat
│   │       ├── broadcast.js     # send / broadcast / broadcastToRoom
│   │       └── heartbeat.js     # ping/pong keep-alive, terminates dead sockets
│   └── test/                    # Node test scripts (see "Tests")
└── frontend/
    ├── index.html
    ├── main.js                  # wires everything together
    ├── framework/src/           # mini VDOM: h / render / patch / State
    ├── src/
    │   ├── engine/              # GameEngine, GameLoop, Renderer, state
    │   ├── gameplay/            # Bomb, BombManager, Explosion, PowerUp
    │   ├── world/               # Map, Player, PlayerManager, input
    │   ├── network/             # WebSocketClient, Lobby, Rooms, Chat
    │   ├── ui/                  # screens, HUD, chat box, components
    │   └── shared/              # constants + event names
    └── styles/                  # reset.css, lobby.css, game.css
```

## Getting Started

Requirements: **Node.js** (for the server) and **Python 3** (or any static file
server) for the frontend. These are two separate processes on two ports.

### 1. Start the backend

```bash
cd backend
npm install        # installs ws
npm start          # → ws://localhost:8080
```

The backend only speaks WebSocket. Visiting `http://localhost:8080` returns a
plain-text "Bomberman backend is running" message — that is expected.

### 2. Start the frontend

In another terminal:

```bash
cd frontend
npm start          # python3 -m http.server 3000
```

Then open **http://localhost:3000** in two or more browser tabs/windows
(use one private window to be a second player), enter a nickname, and start a
room.

The frontend connects to `ws://<page-host>:8080` by default. To point it at a
different backend, append `?ws=ws://host:port` to the page URL, e.g.
`http://localhost:3000/?ws=ws://192.168.1.20:8080`.

> If code changes do not appear after editing, hard-reload the page
> (`Ctrl/Cmd + Shift + R`): `python3 -m http.server` sends no cache headers and
> browsers may reuse a stale ES module.

## How to Play

| Action     | Keys                          |
| ---------- | ----------------------------- |
| Move       | Arrow keys **or** `W` `A` `S` `D` |
| Drop a bomb| `Space`                       |

- Matches need **2 players**, up to **4**.
- A room waits **20s** for more players, then a **10s** countdown starts the
  match (a full room skips the 20s wait).
- Stand in a blast and you lose a life. Lose all hearts and you're out.
- Survive to be the last one standing to win.

## Rules & Tuning

All rules live in `backend/server/game/config.js`:

| Rule                | Value            |
| ------------------- | ---------------- |
| Board               | 15 × 13 tiles    |
| Tile size           | 50 px            |
| Player size         | 25 px            |
| Starting lives      | 3                |
| Starting stats      | 1 bomb, range 1, speed 1 |
| Bomb fuse           | 3000 ms          |
| Flame lifetime      | 500 ms           |
| Block drop chance   | 30 %             |
| Power-ups           | `bomb`, `flame`, `speed` |
| Max bombs / range / speed | 8 / 10 / 5 |

The map is a 15 × 13 grid: a solid wall border with a wall pillar on every even
tile, the four corners cleared for spawns, and a random 50 % scattering of
destructible blocks.

## Architecture

The design is **server-authoritative**. The client is a display + input device:

```
Browser (A)                Node.js server                 Browser (B)
  input ──► move / place_bomb ──► validate against map
                                   update authoritative state
  render ◄── player_moved / place_bomb / explosion / player_hit ──► render
                                   decide winner ──► game_over
```

- **`GameEngine`** (`frontend/src/engine/Game.js`) runs a fixed 60 Hz loop,
  renders the board, and forwards input to the server. It never mutates
  game-affecting state on its own.
- **`GameLoop`** accumulates real time and runs fixed-step updates so movement is
  smooth and frame-rate independent.
- **`Renderer`** builds the board from a virtual DOM; tiles are cached and player
  positions are written straight to the DOM via `translate3d` for smooth motion.
- On the server, `Room` owns the match, `gameLoop.js` runs one tick
  (`advanceBombs → detonate → advanceExplosions → collectPowerUps →
  checkWinner`), and `detonation.js` resolves what each blast covers and who it
  hurts.

### Anti-cheat measures

Even though the client predicts its own movement, the server re-checks every
message and rejects invalid ones:

- A single move larger than `MAX_STEP` (25 px) is rejected as a teleport.
- Movement is metered with a **token bucket** (`BASE_SPEED` px/s × player speed,
  with a small burst budget for lag), so a client cannot move faster than allowed.
- Bombs are placed using the **server's** copy of the player's position, range,
  and bomb count — never numbers sent by the client.
- Damage, power-up pickups, and the winner are computed solely on the server.

## WebSocket Protocol

Every message is JSON with a `type` field. Client message types must match
`backend/server/sockets/handlers.js`; server types must match
`frontend/src/shared/events.js`.

### Client → Server

| Type           | Payload                | Purpose                        |
| -------------- | ---------------------- | ------------------------------ |
| `join`         | `nickname`             | Set a unique nickname          |
| `create_room`  | —                      | Host a new room                |
| `join_room`    | `roomId`               | Join an existing room          |
| `leave_room`   | —                      | Leave the current room         |
| `chat`         | `message`              | Room chat (unlocks in-game)    |
| `global_chat`  | `message`              | Global chat                    |
| `move`         | `x`, `y`               | Movement (server-validated)    |
| `place_bomb`   | —                      | Request a bomb at the server's position |

### Server → Client

| Type                | Purpose                                     |
| ------------------- | ------------------------------------------- |
| `connected`         | Assigned player id                          |
| `joined`            | Nickname accepted                           |
| `error`             | Rejected action / message (may include a corrective position) |
| `rooms_list`        | Lobby room list                             |
| `room_joined`       | Joined a room (host flag + info)            |
| `room_state`        | Player list + countdown state update        |
| `left_room`         | Confirms leaving (client returns to lobby)  |
| `start`             | Match started: players, stats, and map      |
| `player_moved`      | A player's new position                     |
| `player_left`       | A player dropped from a running match       |
| `place_bomb`        | An accepted bomb appeared                   |
| `explosion`         | Blast tiles                                 |
| `block_destroyed`   | A block was removed                         |
| `powerup_spawn`     | A power-up dropped                          |
| `powerup_collected` | A power-up was taken (includes new stats)   |
| `player_hit`        | A player lost a life (`lives`, `alive`)     |
| `game_over`         | Match decided (`winnerId`, or `null`)       |
| `chat` / `global_chat` | Chat messages                            |

## Tests

The backend ships with Node scripts that exercise the authoritative logic
(static checks, real WebSocket round-trips, movement authority, and security).
Run them from the `backend` directory:

```bash
cd backend
node test/audit.test.js        # full project audit (static + runtime + manual)
node test/game-audit.test.js   # rules: lives, damage, blocks, power-ups, winner
node test/movement.test.js     # anti-cheat: teleport / speed limits
node test/security.test.js     # server-authoritative security checks
```

_(These are plain `assert`-based scripts, not a test runner; each file prints its
own results.)_
