const Room = require('./room');

// Cap the number of live rooms so a connection flood cannot fill memory.
const MAX_ROOMS = 100;

class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  // returns the new room, or null when the server already holds the max
  createRoom() {
    if (this.rooms.size >= MAX_ROOMS) {
      return null;
    }

    const id = this.nextId();
    const room = new Room();

    room.id = id;
    room.name = `Room ${id}`;

    this.rooms.set(id, room);
    return room;
  }

  //smallest number not in use, so rooms always start at 1 and freed numbers
  //are reused (the list stays 1..N instead of counting up forever)
  nextId() {
    let id = 1;
    while (this.rooms.has(id)) {
      id += 1;
    }
    return id;
  }

  getRoom(roomId) {
    return this.rooms.get(Number(roomId)) || null;
  }

  removeRoom(roomId) {
    return this.rooms.delete(Number(roomId));
  }

  getRoomList() {
    return Array.from(this.rooms.values(), (room) => room.getPublicInfo());
  }
}

module.exports = RoomManager;