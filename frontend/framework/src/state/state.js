export class State {
  // Create a state object with an initial value
  // and an empty list of listeners
  constructor(initialValue) {
    this.value = initialValue;
    this.listeners = [];
  }

  // Get the current value of the state
  get() {
    return this.value;
  }

  // Set a new value and notify listeners
  set(newValue) {
    this.value = newValue;
    this.triggerListeners();
  }

  // Add a listener
  // Returns a function that removes the listener
  onChange(callback) {
    this.listeners.push(callback);

    return () => {
      this.listeners = this.listeners.filter(
        (listener) => listener !== callback,
      );
    };
  }

  // Trigger all listeners
  triggerListeners() {
    this.listeners.forEach((callback) => {
      callback(this.value);
    });
  }
}
