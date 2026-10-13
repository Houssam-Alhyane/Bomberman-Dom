//set an attribute the DOM way: `false`/`null`/`undefined` remove it and `true`
//adds it as an empty attribute. this matters for boolean attributes like
//`disabled` and `checked`, where the attribute being present (whatever its
//value) is what disables/checks the element.
export function setAttribute(element, name, value) {
  if (value === false || value === null || value === undefined) {
    element.removeAttribute(name);
  } else if (value === true) {
    element.setAttribute(name, '');
  } else {
    element.setAttribute(name, value);
  }
}
