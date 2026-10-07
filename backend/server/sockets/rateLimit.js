const RATE_LIMIT_MAX = 4;
const RATE_LIMIT_WINDOW_MS = 1000;

function initRateLimit(socket) {
  socket.rateWindowStart = Date.now();
  socket.rateWindowCount = 0;
}

function allowMessage(socket) {
  const now = Date.now();

  if (now - socket.rateWindowStart >= RATE_LIMIT_WINDOW_MS) {
    socket.rateWindowStart = now;
    socket.rateWindowCount = 0;
  }

  socket.rateWindowCount++;

  if (socket.rateWindowCount <= RATE_LIMIT_MAX) {
    return { allowed: true, notify: false };
  }

  return {
    allowed: false,
    notify: socket.rateWindowCount === RATE_LIMIT_MAX + 1,
  };
}

module.exports = {
  initRateLimit,
  allowMessage,
};
