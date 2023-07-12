(function(factory) {
  typeof define === "function" && define.amd ? define(factory) : factory();
})(function() {
  "use strict";
  function isArray(target) {
    return Array.isArray(target);
  }
  function isString(target) {
    return typeof target === "string";
  }
  function isNumber(target) {
    return typeof target === "number";
  }
  function isBoolean(target) {
    return typeof target === "boolean";
  }
  const ShapeFlags = {
    ELEMENT: 1,
    TEXT: 1 << 1,
    FRAGMENT: 1 << 2,
    COMPONENT: 1 << 3,
    TEXT_CHILDREN: 1 << 4,
    ARRAY_CHILDREN: 1 << 5,
    CHILDREN: 1 << 4 | 1 << 5
  };
  const Text = Symbol("Text");
  const Fragment = Symbol("Fragment");
  function h(type, props, children) {
    let shapeFlag = 0;
    if (isString(type)) {
      shapeFlag = ShapeFlags.ELEMENT;
    } else if (type === Text) {
      shapeFlag = ShapeFlags.TEXT;
    } else if (type === Fragment) {
      shapeFlag = ShapeFlags.FRAGMENT;
    } else {
      shapeFlag = ShapeFlags.COMPONENT;
    }
    if (isString(children) || isNumber(children)) {
      shapeFlag |= ShapeFlags.TEXT_CHILDREN;
      children = children.toString();
    } else if (isArray(children)) {
      shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    }
    return {
      type,
      props,
      children,
      shapeFlag,
      el: null,
      anchor: null
    };
  }
  const domPropsRE = /\[A-Z]|^(?:value|checked|selected|muted)$/;
  function patchProps(oldProps, newProps, el) {
    if (oldProps === newProps) {
      return;
    }
    oldProps = oldProps || {};
    newProps = newProps || {};
    for (const key in newProps) {
      const prev = oldProps[key];
      const next = newProps[key];
      if (prev !== next) {
        patchDomProp(prev, next, key, el);
      }
    }
    for (const key in oldProps) {
      if (newProps[key] == null) {
        patchDomProp(oldProps[key], null, key, el);
      }
    }
  }
  function patchDomProp(prev, next, key, el) {
    switch (key) {
      case "class":
        el.className = next || "";
        break;
      case "style":
        for (const styleName in next) {
          el.style[styleName] = next[styleName];
        }
        for (const styleName in prev) {
          if (!next.hasOwnProperty(styleName)) {
            el.style[styleName] = "";
          }
        }
        break;
      default:
        if (/^on[^a-z]/.test(key)) {
          const eventName = key.slice(2).toLowerCase();
          if (prev) {
            el.removeEventListener(eventName, prev);
          }
          if (next) {
            el.addEventListener(eventName, next);
          }
        } else if (domPropsRE.test(key)) {
          if (next === "" && isBoolean(el[key])) {
            el[key] = true;
          }
          el[key] = next;
          break;
        } else {
          if (next == null || next === false) {
            el.removeAttribute(key);
          } else {
            el.setAttribute(key, next);
          }
        }
    }
  }
  function render(vnode, container) {
    const prevVNode = container._vnode;
    if (!vnode) {
      if (prevVNode) {
        unmount(prevVNode);
      }
    } else {
      patch(prevVNode, vnode, container);
    }
    container._vnode = vnode;
  }
  function patch(n1, n2, container, anchor) {
    if (n1 && !isSameVNode(n1, n2)) {
      anchor = (n1.anchor || n1.el).nextSibling;
      unmount(n1);
      n1 = null;
    }
    const { shapeFlag } = n2;
    if (shapeFlag & ShapeFlags.COMPONENT)
      ;
    else if (shapeFlag & ShapeFlags.TEXT) {
      processText(n1, n2, container, anchor);
    } else if (shapeFlag & ShapeFlags.FRAGMENT) {
      processFragment(n1, n2, container, anchor);
    } else {
      processElement(n1, n2, container, anchor);
    }
  }
  function mountElement(vnode, container, anchor) {
    const { type, props, shapeFlag, children } = vnode;
    const el = document.createElement(type);
    if (props) {
      patchProps(null, props, el);
    }
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el);
    }
    vnode.el = el;
    container.insertBefore(el, anchor);
  }
  function mountText(vnode, container, anchor) {
    const textNode = document.createTextNode(vnode.children);
    vnode.el = textNode;
    container.insertBefore(textNode, anchor);
  }
  function mountChildren(children, container, anchor) {
    children.forEach((child) => patch(null, child, container, anchor));
  }
  function unmount(vnode) {
    const { shapeFlag, el } = vnode;
    if (shapeFlag & ShapeFlags.COMPONENT)
      ;
    else if (shapeFlag & ShapeFlags.FRAGMENT) {
      unmountFragment(vnode);
    } else {
      el.parentNode.removeChild(el);
    }
  }
  function unmountFragment(vnode) {
    const { el: cur, anchor: end } = vnode;
    const { parentNode } = cur;
    while (cur !== end) {
      let next = cur.nextSibling;
      parentNode.removeChild(cur);
      cur = next;
    }
    parentNode.removeChild(end);
  }
  function processElement(n1, n2, container, anchor) {
    if (n1 == null) {
      mountElement(n2, container, anchor);
    } else {
      patchElement(n1, n2);
    }
  }
  function processFragment(n1, n2, container, anchor) {
    const fragmentStartAnchor = n2.el = n1 ? n1.el : document.createTextNode("");
    const fragmentEndAnchor = n2.anchor = n1 ? n1.anchor : document.createTextNode("");
    if (n1 == null) {
      container.insertBefore(fragmentStartAnchor, anchor);
      container.insertBefore(fragmentEndAnchor, anchor);
      mountChildren(n2.children, container, fragmentEndAnchor);
    } else {
      patchChildren(n1, n2, container, fragmentEndAnchor);
    }
  }
  function processText(n1, n2, container, anchor) {
    if (n1 == null) {
      mountText(n2, container, anchor);
    } else {
      n2.el = n1.el;
      n2.el.textContent = n2.children;
    }
  }
  function unmountChildren(children) {
    children.forEach((child) => unmount(child));
  }
  function patchElement(n1, n2) {
    n2.el = n1.el;
    patchProps(n1.props, n2.props, n2.el);
    patchChildren(n1, n2, n2.el);
  }
  function patchChildren(n1, n2, container, anchor) {
    const { shapeFlag: prevShapeFlag, children: c1 } = n1;
    const { shapeFlag, children: c2 } = n2;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (c2 !== c1) {
        container.textContent = c2;
      }
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1);
      }
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        container.textContent = "";
        mountChildren(c2, container, anchor);
      } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        patchArrayChildren(c1, c2, container, anchor);
      } else {
        mountChildren(c2, container, anchor);
      }
    } else {
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        container.textContent = "";
      } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1);
      }
    }
  }
  function patchArrayChildren(c1, c2, container, anchor) {
    const oldLength = c1.length;
    const newLength = c2.length;
    const commonLength = Math.min(oldLength, newLength);
    for (let i = 0; i < commonLength; i++) {
      patch(c1[i], c2[i], container, anchor);
    }
    if (oldLength > newLength) {
      unmountChildren(c1.slice(commonLength));
    } else {
      mountChildren(c2.slice(commonLength), container, anchor);
    }
  }
  function isSameVNode(prevVNode, vnode) {
    return prevVNode.type === vnode.type;
  }
  render(
    h("ul", null, [
      h("li", null, "first"),
      h(Fragment, null, []),
      h("li", null, "last")
    ]),
    document.body
  );
  setTimeout(() => {
    render(
      h("ul", null, [
        h("li", null, "first"),
        h(Fragment, null, [h("li", null, "middle")]),
        h("li", null, "last")
      ]),
      document.body
    );
  }, 2e3);
});
