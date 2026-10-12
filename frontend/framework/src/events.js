export function isEventProp(key) {
  return key.startsWith('on') && key.length > 2;
}

export function eventName(key) {
  return key.slice(2).toLowerCase();
}
