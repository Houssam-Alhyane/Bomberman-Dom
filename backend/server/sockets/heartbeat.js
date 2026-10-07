
const HEARTBEAT_INTERVAL = 9000;
//send ping to all clients every 9 seconds,and in 9 seconds to send pong back to server
function startHeartbeat(wss) {
  const interval = setInterval(() => {
    wss.clients.forEach((socket) => {
      //the last ping was never answered, the client is gone
      if (socket.isAlive === false) {
        socket.terminate();
        return;
      }

      socket.isAlive = false;
      socket.ping();
    });
  }, HEARTBEAT_INTERVAL);

  wss.on('close', () => clearInterval(interval));
}

module.exports = {
  startHeartbeat,
};
