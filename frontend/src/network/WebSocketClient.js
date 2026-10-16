import { CONNECTION_EVENTS } from '../shared/events.js';

//the frontend and backend run on different ports now, so point at the backend
//port (or add ?ws=ws://some-host:port to the page url to override it)
const BACKEND_PORT = 8080;

function getServerUrl() {
  const custom = new URLSearchParams(location.search).get('ws');
  if (custom) return custom;

  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${location.hostname || 'localhost'}:${BACKEND_PORT}`;
}

export default class WebSocketClient {
  constructor(url = getServerUrl()) {
    this.url = url;
    this.socket = null;
    this.handlers = new Map(); //message type -> list of functions
  }

  //connect clinet to the server
  connect() {
    this.socket = new WebSocket(this.url);

    //setup the socket event handlers
    this.socket.onopen = () => {
      this.emit(CONNECTION_EVENTS.OPEN);
    };
    //handle incoming messages
    this.socket.onmessage = (event) => {
      const message = this.parse(event.data);

      if (message && typeof message.type === 'string') {
        this.emit(message.type, message);
      }
    };

    this.socket.onclose = () => {
      this.emit(CONNECTION_EVENTS.CLOSE);
    };
  }

  //returns true if the message was sent, false if we are not connected
  send(message) {
    if (this.socket?.readyState !== WebSocket.OPEN) return false;

    this.socket.send(JSON.stringify(message));
    return true;
  }

  //listen to one message type, returns a function that stops listening
  on(type, handler) {
    //add the handler to the list for this type
    const list = this.handlers.get(type) || [];
    this.handlers.set(type, [...list, handler]);

    //return a function that removes the handler from the list
    return () => this.off(type, handler);
  }

  off(type, handler) {
    const list = this.handlers.get(type) || [];
    this.handlers.set(
      type,
      list.filter((fn) => fn !== handler),
    );
  }
  //run all handlers
  emit(type, data) {
    (this.handlers.get(type) || []).forEach((handler) => handler(data));
  }

  parse(text) {
    try {
      return JSON.parse(text);
    } catch (e) {
      return null; //ignore messages that are not valid JSON
    }
  }
}
