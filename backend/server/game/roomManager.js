const Room = require('./room');

class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.nextRoomId = 1;
  }

  createRoom() {
    const id = this.nextRoomId++;
    const room = new Room();

    room.id = id;
    room.name = `Room ${id}`;

    this.rooms.set(id, room);
    return room;
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