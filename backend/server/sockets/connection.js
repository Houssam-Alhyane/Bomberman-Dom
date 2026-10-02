function handleConnection(socket) {
  console.log('Client connected');

  socket.send(
    JSON.stringify({
      type: 'connected',
      message: 'Welcome to Bomberman server',
    }),
  );

  socket.on('close', () => {
    console.log('Client disconnected');
  });
}

module.exports = {
  handleConnection,
};
