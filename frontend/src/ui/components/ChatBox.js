import { h, render, patch, State } from '../../../framework/src/index.js';

// Room chat. The typed text stays in the input, so a re-render never erases it.
export default class ChatBox {
  constructor(container, { onSend } = {}) {
    this.container = container;
    this.onSend = onSend;
    this.counter = 0;
    this.old = null;
    this.node = null;

    this.state = new State({ messages: [], error: '', visible: false });
    this.state.onChange(() => this.render());
    this.render();
  }

  show() {
    this.set({ visible: true });
  }

  hide() {
    this.set({ visible: false });
  }

  // A message trustingly shaped by the Chat module.
  add(entry) {
    this.counter += 1;
    const messages = [...this.state.get().messages, { id: this.counter, ...entry }].slice(-50);
    this.set({ messages, error: '' });
  }

  setError(text) {
    this.set({ error: text });
  }

  submit(event) {
    event.preventDefault();

    const input = event.currentTarget.querySelector('.chat-input');
    const text = input.value.trim();
    if (!text) return;

    if (this.onSend?.(text)) input.value = '';
  }

  view() {
    const { messages, error, visible } = this.state.get();

    return h('section', { id: 'chat-box', class: visible ? 'chat-box' : 'chat-box hidden' }, [
      h(
        'ul',
        { class: 'chat-messages' },
        messages.map((m) =>
          h('li', { class: `chat-msg${m.own ? ' own' : ''}`, key: String(m.id) }, [
            h('span', { class: 'chat-author' }, [`${m.nickname || 'Player'}: `]),
            m.message,
          ])
        )
      ),
      error ? h('p', { class: 'chat-error' }, [error]) : h('p', { class: 'chat-error hidden' }, ['']),
      h('form', { class: 'chat-form', onSubmit: (event) => this.submit(event) }, [
        h('input', {
          class: 'chat-input',
          type: 'text',
          maxlength: '200',
          placeholder: 'Message...',
          'aria-label': 'Chat message',
        }),
        h('button', { class: 'btn btn-primary btn-small', type: 'submit' }, ['Send']),
      ]),
    ]);
  }

  render() {
    const next = this.view();

    this.node = this.old ? patch(this.old, next, this.node) : render(next, this.container);
    this.old = next;

    const list = this.node.querySelector('.chat-messages');
    if (list) list.scrollTop = list.scrollHeight;
  }

  set(patchState) {
    this.state.set({ ...this.state.get(), ...patchState });
  }
}
