export function createVNode(tag, attrs = {}, children = []) {
    return {
        tag,
        attrs,
        children,
    };
}