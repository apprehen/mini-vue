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
  const ShapeFlags = {
    ELEMENT: 1,
    // 0000000000000001
    TEXT: 1 << 1,
    // 0000000000000010
    FRAGMENT: 1 << 2,
    // 0000000000000100
    COMPONENT: 1 << 3,
    // 0000000000001000
    TEXT_CHILDREN: 1 << 4,
    // 0000000000001000
    ARRAY_CHILDREN: 1 << 5,
    // 0000000000100000
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
      shapeFlag
    };
  }
  function render(vnode2, container) {
    mount(vnode2, container);
  }
  function mount(vnode2, container) {
    const { shapeFlag } = vnode2;
    if (shapeFlag & ShapeFlags.ELEMENT) {
      mountElement(vnode2, container);
    } else if (shapeFlag & ShapeFlags.TEXT) {
      mountText(vnode2, container);
    } else if (shapeFlag & ShapeFlags.FRAGMENT) {
      mountFragment(vnode2, container);
    } else
      ;
  }
  function mountElement(vnode2, container) {
    const { type, props } = vnode2;
    const el = document.createElement(type);
    moutProps(props, el);
    mountChildren(vnode2, el);
    container.appendChild(el);
  }
  function mountText(vnode2, container) {
    const textNode = document.createTextNode(vnode2.children);
    container.appendChild(textNode);
  }
  function mountFragment(vnode2, container) {
    mountChildren(vnode2, container);
  }
  const domPropsRE = /\[A-Z]|^(?:value|checked|selected|muted)$/;
  function moutProps(props, el) {
    for (const key in props) {
      const value = props[key];
      switch (key) {
        case "class":
          el.className = value;
          break;
        case "style":
          for (const styleName in value) {
            el.style[styleName] = value[styleName];
          }
          break;
        default:
          if (/^on[^a-z]/.test(key)) {
            const eventName = key.slice(2).toLowerCase();
            el.addEventListener(eventName, value);
          } else if (domPropsRE.test(key)) {
            if (value === "" && typeof el[key] === "boolean") {
              value = true;
            }
            el[key] = value;
          } else {
            if (value == null || value === false) {
              el.removeAttribute(key);
            } else {
              el.setAttribute(key, value);
            }
          }
          break;
      }
    }
  }
  function mountChildren(vnode2, container) {
    const { shapeFlag, children } = vnode2;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      mountText(vnode2, container);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      children.forEach((child) => mount(child, container));
    }
  }
  const vnode = h(
    "div",
    {
      class: "a b",
      style: {
        border: "1px solid red",
        fontSize: "20px"
      },
      onClick: () => {
        console.log("click");
      },
      id: "foo",
      checked: "",
      custom: false
    },
    [
      h("ul", null, [
        h("li", { style: { color: "red" } }, "1"),
        h("li", { style: { color: "green" } }, "2"),
        h("li", { style: { color: "blue" } }, "3"),
        h(Fragment, null, [h("li", null, "4"), h("li", null, "5")]),
        h(Text, null, "6"),
        h("li", null, "hello world")
      ])
    ]
  );
  render(vnode, document.body);
});
