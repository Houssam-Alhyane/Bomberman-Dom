
export function setAttribute(element, name, value) {
  if (value === false || value === null || value === undefined) {
    element.removeAttribute(name);
  } else if (value === true) {
    element.setAttribute(name, '');
  } else {
    element.setAttribute(name, value);
  }
}
