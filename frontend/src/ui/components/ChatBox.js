import { h, render, patch, State } from '../../../framework/src/index.js';

export default class ChatBox {
  constructor(container, { onSend, onToggle } = {}) {
    this.container = container;
    this.onSend = onSend;
    this.onToggle = onToggle;
    this.old = null;
    this.node = null;

    this.state = new State({ messages: [], isOpen: false, error: null });
    this.state.onChange(() => this.render());
    this.render();
  }

  // 
  toggle() {
    const isOpen = !this.state.get().isOpen; // reverse value
    this.state.set({ ...this.state.get(), isOpen }); // update state
    this.onToggle?.(isOpen); // stop mouvement?
  }
  // if chat is oprn , close it
  close() {
    if (this.state.get().isOpen) this.toggle();
  }

  add(entry) {
    const messages = [...this.state.get().messages, entry].slice(-30);// add new message & show last 30 message
    this.state.set({ ...this.state.get(), messages, error: null });
  }

  setError(text) {
    this.state.set({ ...this.state.get(), error: text });
  }

  submit(event) {
    event.preventDefault();
    const input = event.currentTarget.querySelector('.chat-input');
    const text = input.value.trim(); // if text is plein
    if (text) {
      this.onSend?.(text); // send message to server
      input.value = '';
    }
    this.toggle(); 
  }

  view() {
    const { messages, isOpen, error } = this.state.get();
    
    return h('div', { class: `chat-modal-wrapper ${isOpen ? 'active' : 'hidden'}` }, [
      h('div', { class: 'chat-window' }, [
        h('div', { class: 'chat-header' }, [
          h('span', {}, ['Game Chat']),
          h('button', { class: 'close-btn', onClick: () => this.toggle() }, ['X'])
        ]),
        h('ul', { class: 'chat-messages' }, messages.map(m =>
          h('li', { class: `chat-msg ${m.own ? 'own' : ''}` }, [
            h('span', { class: 'chat-author' }, [`${m.nickname}: `]),
            m.message,
          ])
        )),
        h('p', { class: 'chat-error' }, [error || '']),
        h('form', { class: 'chat-form', onSubmit: (e) => this.submit(e) }, [
          // Keep game keys (space, arrows) away from the game input handler.
          h('input', { class: 'chat-input', type: 'text', placeholder: 'Type a message...', onKeydown: (e) => e.stopPropagation() }),
          h('button', { type: 'submit' }, ['Send'])
        ])
      ])
    ]);
  }

  render() {
    const next = this.view();
    this.node = this.old ? patch(this.old, next, this.node) : render(next, this.container);
    this.old = next;
  }
}
