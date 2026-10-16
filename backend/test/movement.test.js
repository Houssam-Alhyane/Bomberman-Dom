// Movement authority tests: can a client teleport or move faster than allowed?
// Run with: node test/movement.test.js

const assert = require('assert');
const { move } = require('../server/sockets/movement');
const { TILE_SIZE } = require('../server/game/map');

// movement.js only reads room.map.canMoveTo(), so a stub is enough.
function makeMap(canMove = () => true) {
  return { canMoveTo: canMove };
}

function makeEnv(canMove) {
  const received = [];

  const socket = {
    readyState: 1, // WebSocket.OPEN
    send(data) {
      received.push(JSON.parse(data));
    },
  };

  const player = {
    id: 1,
    nickname: 'Tester',
    roomId: 1,
    alive: true,
    speed: 1,
    x: 3 * TILE_SIZE,
    y: 3 * TILE_SIZE,
    socket,
  };

  const room = {
    id: 1,
    state: 'playing',
    map: makeMap(canMove),
    players: [player],
  };
  const roomManager = { getRoom: () => room };

  return { player, roomManager, received };
}

const errors = (received) => received.filter((m) => m.type === 'error');

let passed = 0;
function check(name, fn) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('Movement authority tests\n');

check('accepts a legal small step', () => {
  const { player, roomManager, received } = makeEnv();
  const start = player.x;
  move(player.socket, player, roomManager, { type: 'move', x: start + 10, y: player.y });
  assert.strictEqual(player.x, start + 10, 'position updated');
  assert.strictEqual(errors(received).length, 0, 'no rejection');
});

check('rejects a teleport and keeps position', () => {
  const { player, roomManager, received } = makeEnv();
  const start = player.x;
  move(player.socket, player, roomManager, { type: 'move', x: 9999, y: 9999 });
  assert.strictEqual(player.x, start, 'position unchanged');
  assert.strictEqual(errors(received)[0].message, 'Invalid move', 'teleport rejected');
});

check('rejects a non-numeric position', () => {
  const { player, roomManager, received } = makeEnv();
  move(player.socket, player, roomManager, { type: 'move', x: NaN, y: player.y });
  assert.strictEqual(errors(received)[0].message, 'Invalid move', 'NaN rejected');
});

check('rejects a move into a wall or block', () => {
  const { player, roomManager, received } = makeEnv(() => false);
  move(player.socket, player, roomManager, { type: 'move', x: player.x + 10, y: player.y });
  assert.strictEqual(errors(received)[0].message, 'Invalid move', 'blocked tile rejected');
});

check('rejects a speed hack (travel budget)', () => {
  const { player, roomManager, received } = makeEnv();
  let caught = false;
  for (let i = 0; i < 10; i++) {
    move(player.socket, player, roomManager, { type: 'move', x: player.x + 25, y: player.y });
    if (errors(received).some((e) => e.message === 'Slow down')) {
      caught = true;
      break;
    }
  }
  assert.ok(caught, 'rapid frames exceed the per-second budget');
});

console.log(`\n${passed} checks passed`);
