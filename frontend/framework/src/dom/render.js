import { isEventProp, eventName } from "../events.js";

export function render(vnode, container) {
    if (vnode === null || vnode === undefined || vnode === false) {
        return;
    }

    if (typeof vnode === "string") {
        const textNode = document.createTextNode(vnode);
        container.appendChild(textNode);
        return textNode;
    }

    const element = document.createElement(vnode.tag);

    for (const [name, value] of Object.entries(vnode.attrs)) {
        if (name === "key") {
            continue;
        }

        if (isEventProp(name)) {
            element.addEventListener(eventName(name), value);
        } else if (name === "checked") {
            element.checked = Boolean(value);
        } else {
            element.setAttribute(name, value);
        }
    }

    for (const child of vnode.children) {
        render(child, element);
    }

    container.appendChild(element);
    return element;
}