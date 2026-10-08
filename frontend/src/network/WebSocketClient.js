import { CONNECTION_EVENTS } from '../shared/events.js';

const RECONNECT_BASE_DELAY_MS = 500;
const RECONNECT_MAX_DELAY_MS = 5000;

//ws:// of the page itself when served by the backend, ?ws= overrides it for a separate dev server
function resolveUrl() {
  const override = new URLSearchParams(location.search).get('ws');
  if (override) return override;

  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = location.host || 'localhost:8080';

  return `${protocol}//${host}`;
}

//thin wrapper around the browser WebSocket: JSON in, JSON out, one handler list per type
export default class WebSocketClient {
  constructor(url = resolveUrl()) {
    this.url = url;
    this.socket = null;
    this.handlers = new Map();
    this.reconnectDelay = RECONNECT_BASE_DELAY_MS;
    this.reconnectTimer = null;
    this.closedByUser = false;
  }

  connect() {
    this.closedByUser = false;
    this.open();
  }

  open() {
    this.socket = new WebSocket(this.url);

    this.socket.addEventListener('open', () => {
      this.reconnectDelay = RECONNECT_BASE_DELAY_MS;
      this.emit(CONNECTION_EVENTS.OPEN);
    });

    this.socket.addEventListener('message', (event) => {
      const message = this.parse(event.data);

      if (message && typeof message.type === 'string') {
        this.emit(message.type, message);
      }
    });

    this.socket.addEventListener('close', () => {
      this.socket = null;
      this.emit(CONNECTION_EVENTS.CLOSE);

      if (!this.closedByUser) {
        this.scheduleReconnect();
      }
    });

    this.socket.addEventListener('error', () => {
      //the close event always follows, reconnect is scheduled there
    });
  }

  scheduleReconnect() {
    clearTimeout(this.reconnectTimer);

    this.reconnectTimer = setTimeout(() => this.open(), this.reconnectDelay);

    this.reconnectDelay = Math.min(
      this.reconnectDelay * 2,
      RECONNECT_MAX_DELAY_MS,
    );
  }

  send(message) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    this.socket.send(JSON.stringify(message));

    return true;
  }

  //returns the registered handler so the caller can unsubscribe
  on(type, handler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }

    this.handlers.get(type).add(handler);

    return () => this.off(type, handler);
  }

  off(type, handler) {
    this.handlers.get(type)?.delete(handler);
  }

  emit(type, payload) {
    this.handlers.get(type)?.forEach((handler) => handler(payload));
  }

  parse(data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.warn('Dropped malformed server message', e);

      return null;
    }
  }

  close() {
    this.closedByUser = true;
    clearTimeout(this.reconnectTimer);
    this.socket?.close();
  }
}
