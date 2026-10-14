import {
  h,
  render,
  patch,
  State,
} from '../../framework/src/index.js';

const MASCOTS = ['💣', '💣', '💣'];

//nickname entry screen: the whole box is a vnode tree, redrawn from a State
//whenever status / error / enabled / value / visible change
export default class NicknameScreen {
  constructor({ onSubmit } = {}) {
    this.onSubmit = onSubmit;
    this.root = document.getElementById('app');

    this.state = new State({
      visible: true,
      status: 'Connecting...',
      error: '',
      enabled: false,
      value: '',
    });

    this.oldVNode = null;
    this.domNode = null;

    this.state.onChange(() => this.update());
    this.update();
  }

  view() {
    const { visible, status, error, enabled, value } = this.state.get();

    return h(
      'section',
      { id: 'nickname-screen', class: visible ? 'lobby' : 'lobby hidden' },
      [
        h('div', { class: 'lobby-box' }, [
          h(
            'div',
            { class: 'lobby-mascots' },
            MASCOTS.map((icon, index) =>
              h('span', { class: `bomb bomb-${index + 1}` }, [icon]),
            ),
          ),
          h('h1', { class: 'lobby-title' }, [
            h('span', {}, ['BOMB']),
            h('span', {}, ['ERMAN']),
          ]),
          h('div', { id: 'lobby-status', class: 'lobby-status' }, [status]),
          h('div', { id: 'lobby-error', class: 'lobby-error', role: 'alert' }, [
            error,
          ]),
          h(
            'form',
            {
              id: 'nickname-form',
              class: 'lobby-form',
              autocomplete: 'off',
              onSubmit: (event) => this.handleSubmit(event),
            },
            [
              h('input', {
                id: 'nickname-input',
                type: 'text',
                maxlength: 20,
                placeholder: 'Enter nickname',
                'aria-label': 'Nickname',
                autocomplete: 'off',
                disabled: !enabled,
                value,
              }),
              h(
                'button',
                {
                  id: 'join-btn',
                  type: 'submit',
                  class: 'btn btn-primary',
                  disabled: !enabled,
                },
                ['Continue'],
              ),
            ],
          ),
        ]),
      ],
    );
  }

  //the typed text never enters the state, so a re-render can never overwrite
  //what the player is writing: the input keeps its own value between patches
  handleSubmit(event) {
    event.preventDefault();

    if (!this.state.get().enabled) return;

    const input = event.currentTarget.querySelector('#nickname-input');

    this.onSubmit?.(input.value.trim());
  }

  update() {
    const next = this.view();
    //render for the first time, or patch the old vnode with the new one
    this.domNode =
      this.oldVNode === null
        ? render(next, this.root)
        : patch(this.oldVNode, next, this.domNode);

    this.oldVNode = next;
  }

  setStatus(text) {
    this.set({ status: text });
  }

  setError(text) {
    this.set({ error: text });
  }

  clearError() {
    this.setError('');
  }

  setEnabled(enabled) {
    this.set({ enabled });
  }

  show() {
    this.set({ visible: true });
  }

  hide() {
    this.set({ visible: false });
  }

  focus() {
    const input = document.getElementById('nickname-input');

    input?.focus();
    input?.select();
  }
  //changes the state with a patch, merging the new values with the old ones
  set(patchState) {
    this.state.set({ ...this.state.get(), ...patchState });
  }
}
