import { createVNode } from "./vnode.js";

export function h(tag, attrs = {}, children = []) {
    if (Array.isArray(attrs)) {
        children = attrs;
        attrs = {};
    } else if (typeof attrs === "string") {
        children = [attrs];
        attrs = {};
    } else if (typeof children === "string") {
        children = [children];
    }

    return createVNode(tag, attrs, children);
}