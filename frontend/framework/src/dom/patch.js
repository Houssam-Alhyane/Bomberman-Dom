import { render } from "./render.js";
import { isEventProp, eventName } from "../events.js";

export function patch(oldVNode, newVNode, domNode) {
    if (newVNode === null || newVNode === undefined || newVNode === false) {
        domNode.remove();
        return;
    }

    // 1- text => text
    if (typeof oldVNode === "string" && typeof newVNode === "string") {
        if (oldVNode !== newVNode) {
            domNode.textContent = newVNode;
        }
        return;
    }

    // 2- text <=> element
    if (
        typeof oldVNode === "string" ||
        typeof newVNode === "string" ||
        oldVNode.tag !== newVNode.tag
    ) {
        replaceNode(newVNode, domNode);
        return;
    }

    // 3- both is elements
    // -compare old & new list with keys & keep same order
    updateAttributes(oldVNode.attrs, newVNode.attrs, domNode);
    // - 
    patchChildren(oldVNode.children, newVNode.children, domNode);
}

function replaceNode(vnode, domNode) {
    const temp = document.createElement("div");
    render(vnode, temp);
    domNode.replaceWith(temp.firstChild);
}


function patchChildren(oldChildren, newChildren, domNode) {

    // check if childs has keys
    const hasKeys =
        newChildren.length > 0 &&
        newChildren.every(
            child => child && child.attrs && child.attrs.key !== undefined
        );

    // havink keys
    if (hasKeys) {
        patchKeyedChildren(oldChildren, newChildren, domNode);
        return;
    }


    // not havink keys ; index methode
    // old = [a,b,c] , new = [a,x]
    const max = Math.max(oldChildren.length, newChildren.length);//old
    const toRemove = []; // resolve indexing probleme

    for (let i = 0; i < max; i++) {
        const oldChild = oldChildren[i];
        const newChild = newChildren[i];
        const domChild = domNode.childNodes[i];

        // 1- new child didn't exixt in old
        if (oldChild === undefined) {
            render(newChild, domNode);
        } else if (newChild === undefined) { // exist in old , no in new
            toRemove.push(domChild);
        } else {
            patch(oldChild, newChild, domChild);
        }
    }

    for (const node of toRemove) {
        node.remove();
    }
}

function patchKeyedChildren(oldChildren, newChildren, domNode) {

    const oldByKey = {};

    // store old elements
    for (let i = 0; i < oldChildren.length; i++) { // [a,b,c]
        const child = oldChildren[i];

        oldByKey[child.attrs.key] = {
            vnode: child,
            node: domNode.childNodes[i],
        };
    }

    // finding new keys
    const newKeys = new Set(
        newChildren.map(child => child.attrs.key) // store keys of childs
    );

    // removing deleted nodes
    for (const key in oldByKey) {
        if (!newKeys.has(key)) {
            oldByKey[key].node.remove();
        }
    }

    let previousNode = null;

    for (const newChild of newChildren) { // [a,x,b]
        const key = newChild.attrs.key;
        const existing = oldByKey[key]; // [a,b,c]
        let currentNode;

        if (existing) { // check if new key is exist in oldkeys
            patch(existing.vnode, newChild, existing.node);
            currentNode = existing.node;
        } else {
            const temp = document.createElement("div");
            render(newChild, temp);
            currentNode = temp.firstChild;
        }

        let nextNode;

        if (previousNode === null) {
            nextNode = domNode.firstChild;
        } else {
            nextNode = previousNode.nextSibling;
        }

        if (currentNode !== nextNode) {
            if (previousNode === null) {
                domNode.insertBefore(currentNode, domNode.firstChild);
            } else {
                previousNode.after(currentNode); // [a,x]
            }
        }

        previousNode = currentNode;
    }
}

function updateAttributes(oldAttrs, newAttrs, element) {

    // check news, add or update
    for (const [name, value] of Object.entries(newAttrs)) {
        if (name === "key") continue;

        if (isEventProp(name)) { // onCLick , onInput , onChange
            if (oldAttrs[name] !== value) { // oldFunction != newFunction
                if (oldAttrs[name]) { 
                    element.removeEventListener( // remove old event
                        eventName(name),
                        oldAttrs[name]
                    );
                }
                // add new event
                element.addEventListener(eventName(name), value);
            }
        } else if (name === "checked") {
            if (oldAttrs[name] !== value) {
                element.checked = Boolean(value);
            }
        } else if (oldAttrs[name] !== value) {
            element.setAttribute(name, value);
        }
    }

    // check old, check deleted attrs
    for (const name of Object.keys(oldAttrs)) {
        if (name === "key" || name in newAttrs) continue;

        if (isEventProp(name)) {
            element.removeEventListener(
                eventName(name),
                oldAttrs[name]
            );
        } else if (name === "checked") {
            element.checked = false;
        } else {
            element.removeAttribute(name);
        }
    }
}