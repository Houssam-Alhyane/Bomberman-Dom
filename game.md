handle those.

🎯 Your responsibility

Your part has 4 main areas:

1. MAP
   ↓
2. PLAYERS
   ↓
3. MOVEMENT
   ↓
4. COLLISION

And you should build them in exactly that order.

🥇 TASK 1 — Understand the grid/map

Before writing code, agree with Person 1 on the coordinate system.

I recommend:

x → →
y
↓

Example 11 × 9 map:

       x
    0 1 2 3 4 5 6 7 8 9 10
  0 W W W W W W W W W W W
  1 W . . B . . . B . . W
  2 W . W . W . W . W . W
  3 W B . . . . . . . B W
  4 W . W . W . W . W . W
  5 W B . . . . . . . B W
  6 W . W . W . W . W . W
  7 W . . B . . . B . . W
  8 W W W W W W W W W W W

Where:

W = wall
B = destructible block
. = empty

The important thing is that every player uses the same coordinates.

🥈 TASK 2 — Create the Map

Create something like:

src/game/map/
├── Map.js
├── Tile.js
├── Wall.js
└── Block.js

You don't necessarily need four files if your team wants a simpler architecture.

Your Map should know:

{
    width: 11,
    height: 9,
    tiles: [...]
}

For example:

class Map {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = [];
    }
}
🥉 TASK 3 — Create permanent walls

Walls are not destroyable.

You need to establish their positions.

For example:

const walls = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    // ...
];

Or, preferably, generate them from the grid.

Your map needs:

Top border
Bottom border
Left border
Right border
Internal walls

Example:

W W W W W W W
W . . . . . W
W . W . W . W
W . . . . . W
W W W W W W W
🟡 TASK 4 — Generate destructible blocks

This is different from walls.

A block:

B

can be destroyed later by Person 3's bomb system.

Your responsibility is only:

Create the blocks and make them part of the map.

Person 3 will later destroy them.

Random generation

The project says blocks should be generated randomly.

So your map could do:

random position
      ↓
is it a wall?
      ↓
yes → don't place
      ↓
no
      ↓
is it spawn area?
      ↓
yes → don't place
      ↓
no
      ↓
place block
🔴 TASK 5 — Create safe spawn areas

This is very important.

The four players start in the corners.

For example:

P1                         P2


P3                         P4

You must not randomly put blocks directly around the players.

For example, this is bad:

B B W W W W W B B
B P . W . . W . P
W . W W W W W . W

Because a player could immediately place a bomb and have nowhere to escape.

Instead:

P . . W . . W . P
. . B . . B . B .
B . W W W W W . B

Each player should have enough free space around their starting position.

Define something like:

const spawnPositions = [
    { x: 1, y: 1 },
    { x: 9, y: 1 },
    { x: 1, y: 7 },
    { x: 9, y: 7 }
];

Then tell your map generator:

Never place a destructible block in the protected spawn zones.

🟢 TASK 6 — Create the Player class

Now create:

Player.js

A player needs at minimum:

{
    id,
    nickname,
    x,
    y,
    lives,
    speed,
    alive
}

For example:

class Player {
    constructor(id, nickname, x, y) {
        this.id = id;
        this.nickname = nickname;

        this.x = x;
        this.y = y;

        this.lives = 3;
        this.speed = 1;

        this.alive = true;
    }
}

Don't add bomb-related properties yourself if Person 3 owns those.

Instead, agree with Person 3 about where properties such as:

bombCapacity
flameRange

will live.

🟢 TASK 7 — Create the 4 spawn positions

Your player system needs to know:

Player 1 → top-left
Player 2 → top-right
Player 3 → bottom-left
Player 4 → bottom-right

Example:

const spawnPositions = [
    { x: 1, y: 1 },
    { x: 9, y: 1 },
    { x: 1, y: 7 },
    { x: 9, y: 7 }
];

When Person 4 tells the game:

"Player Mohammed joined"

your system should be able to create:

new Player(
    "player-1",
    "Mohammed",
    1,
    1
);
🟦 TASK 8 — Player movement

Now implement keyboard movement.

Basic controls:

↑ → move up
↓ → move down
← → move left
→ → move right

The flow should be:

Keyboard
   ↓
Movement system
   ↓
Calculate new position
   ↓
Collision system
   ↓
Allowed?
  / \
YES  NO
 ↓    ↓
Move  Don't move

Example:

movePlayer(player, dx, dy) {
    const newX = player.x + dx;
    const newY = player.y + dy;

    if (this.canMoveTo(newX, newY)) {
        player.x = newX;
        player.y = newY;
    }
}
🟥 TASK 9 — Collision system

This is one of your most important tasks.

Your collision system answers:

"Can this player move to this position?"

Initially you need to handle:

Player ↔ Wall
Player ↔ Block
Player ↔ Map boundary

Example:

P → .

Allowed.

But:

P → W

Not allowed.

And:

P → B

Not allowed.

Collision function

Create something conceptually like:

canMoveTo(x, y) {
    if (!this.isInsideMap(x, y)) {
        return false;
    }

    if (this.map.isWall(x, y)) {
        return false;
    }

    if (this.map.isBlock(x, y)) {
        return false;
    }

    return true;
}

This function becomes very important later.

Person 3 will need to consider bombs/explosions, and you can extend the collision system with the team instead of creating another collision system.

🟣 TASK 10 — Connect your work to Person 1's State

This is important because Person 1 owns the global state.

You should NOT create another completely separate global state.

Person 1 might provide:

gameState.get();
gameState.set(...);

You update the part you're responsible for.

For example:

const state = gameState.get();

const updatedPlayers = state.players.map(player => {
    if (player.id !== playerId) {
        return player;
    }

    return {
        ...player,
        x: newX,
        y: newY
    };
});

Then update the global state according to the API Person 1 establishes.

Before coding this part, ask Person 1 for the exact GameState API.

🟠 TASK 11 — Render your map and players

Person 1 owns the general renderer, but you provide the map/player data it needs.

For example:

GameState
    │
    ├── map
    │    ├── walls
    │    └── blocks
    │
    └── players
         ├── player 1
         ├── player 2
         ├── player 3
         └── player 4

The renderer can then create:

<div class="tile wall"></div>

<div class="tile block"></div>

<div class="player player-1"></div>

Don't build a second rendering engine.

🟤 TASK 12 — Test your part independently

Before integrating WebSocket/bombs, your local test should work.

You should be able to launch the game and see:

┌─────────────────────────────┐
│ P1                       P2 │
│                             │
│    W     B     W            │
│                             │
│       B       B             │
│                             │
│ P3                       P4 │
└─────────────────────────────┘

Then:

Test 1

Player moves:

P → .

Should work.

Test 2

Player tries wall:

P → W

Should not work.

Test 3

Player tries block:

P → B

Should not work.

Test 4

Player tries outside map:

P → outside

Should not work.

Test 5

Random map generated multiple times.

Check that:

walls remain fixed
blocks change
spawn zones remain safe
Test 6

Four players:

P1 P2 P3 P4

Each starts at the correct corner.

📁 Your final files

I recommend your part eventually looks roughly like:

src/
└── game/
    │
    ├── map/
    │   ├── Map.js
    │   ├── Tile.js
    │   ├── Wall.js
    │   └── Block.js
    │
    ├── player/
    │   ├── Player.js
    │   ├── PlayerManager.js
    │   └── Spawn.js
    │
    └── collision/
        └── Collision.js

You don't have to follow this exact structure if the team already has another architecture.

✅ Your tasks in exact order

Don't jump around. Do them like this:

1. Agree on coordinate/grid system
          ↓
2. Create Map
          ↓
3. Create fixed Walls
          ↓
4. Create random Blocks
          ↓
5. Protect the 4 spawn zones
          ↓
6. Create Player class
          ↓
7. Create 4 spawn positions
          ↓
8. Create PlayerManager
          ↓
9. Implement movement
          ↓
10. Implement collision
          ↓
11. Connect players/map to GameState
          ↓
12. Connect with Person 1's renderer
          ↓
13. Test map
          ↓
14. Test player movement
          ↓
15. Test collision
          ↓
16. Integrate with Person 3's bombs
          ↓
17. Integrate with Person 4's WebSocket
🚨 What you should NOT do

Because these belong to other team members:

❌ Don't implement
Bombs
Explosions
Power-ups
Chat
WebSocket
Lobby
Countdown
FPS/Game Loop
Your focus is:
              YOUR PART
                 │
       ┌─────────┴─────────┐
       ↓                   ↓
      MAP               PLAYERS
       │                   │
       ├─ Walls            ├─ Spawn
       ├─ Blocks           ├─ Position
       └─ Grid             └─ Movement
                 │
                 ↓
              COLLISION
One important thing before you start

Because you're using the mini-framework you created previously, don't start by writing Map.js immediately.

First, ask Person 1 for the exact shape of the global GameState and the renderer API. Then you can build your Map, Player, and Collision around that contract. This avoids having to rewrite your code when everyone merges their branches.