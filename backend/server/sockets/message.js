//raw frame -> message object, null when the payload is not usable
function parseMessage(data) {
  let msg;

  try {
    msg = JSON.parse(data.toString());
  } catch (e) {
    return null;
  }

  // JSON.parse gives back null for "null", arrays are not messages either
  if (!msg || typeof msg !== 'object' || Array.isArray(msg)) {
    return null;
  }

  return msg;
}

module.exports = {
  parseMessage,
};
