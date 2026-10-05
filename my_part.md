👤 Person 2 — Map + Players + Movement + Collision

This person owns the physical world.

1. Map system

Create the Bomberman map.

For example:

W W W W W W W W W W W
W P . B . W . B . P W
W . W W . W . W W . W
W B . . . . . . . B W
W . W . W W W . W . W
W B . . . . . . . B W
W . W W . W . W W . W
W P . B . W . B . P W
W W W W W W W W W W W

Where:

W = permanent wall
B = destructible block
. = empty space
P = player spawn
2. Fixed walls

Walls must always be in the same positions.

For example:

wall
wall
wall
wall

They cannot be destroyed.

3. Random blocks

Destructible blocks are generated randomly.

But there is an important rule:

Spawn zones must remain safe.

For example, Player 1 starts:

P . .
. . .
. . W

So random blocks cannot appear directly around the player.

Do the same for all four corners.

4. Map representation

Person 2 should decide with the team whether the map is represented as:

[
    ["W", "W", "W", "W"],
    ["W", "P", ".", "W"],
    ["W", ".", "B", "W"],
    ["W", "W", "W", "W"]
]

or objects:

{
    type: "wall",
    x: 2,
    y: 4
}

I recommend a grid-based map because Bomberman is naturally grid-based.

5. Player entity

Each player needs:

{
    id: "p1",
    nickname: "Mohammed",

    x: 1,
    y: 1,

    lives: 3,

    speed: 3,

    bombs: 1,

    flameRange: 1,

    alive: true
}
6. Player movement

Handle:

↑
↓
←
→

Using keyboard events.

Example:

keydown
   ↓
check key
   ↓
calculate new position
   ↓
collision check
   ↓
move player
7. Collision system

The player cannot walk through:

Walls
Blocks
Map boundaries

For example:

Player → Block

      P B
      ↑
 collision
      ↓
 Player cannot move

Later, bombs will also interact with this system.

8. Player spawn

The four starting positions:

P1 ─────────────── P2


P3 ─────────────── P4

Each player receives a unique spawn point.

9. Player death

Person 2 can implement the physical death state, while Person 3 handles bomb damage.

For example:

player.lives--;

if (player.lives <= 0) {
    player.alive = false;
}

But agree with Person 3 on who owns this code to avoid duplication.

Person 2 deliverables
frontend/src/game/
│
├── Map.js
├── Tile.js
├── Wall.js
├── Block.js
├── Player.js
├── Movement.js
├── Collision.js
└── Spawn.js
Person 2 should finish with:
Map
Walls
Random blocks
Safe spawn areas
4 spawn positions
Player entity
Keyboard movement
Collision
Player position rendering