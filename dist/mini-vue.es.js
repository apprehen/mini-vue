function isObject(val) {
  return typeof val === "object" && val !== null;
}
function haschanged(oldValue, newValue) {
  return oldValue !== newValue && !(Number.isNaN(oldValue) && Number.isNaN(newValue));
}
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
    anchor: null,
    key: props && (props.key != null ? props.key : null),
    component: null
    //专门用于存储组件的实例
  };
}
function normalizeVNode(result) {
  if (Array.isArray(result)) {
    return h(Fragment, null, result);
  }
  if (isObject(result)) {
    return result;
  }
  return h(Text, null, result.toString());
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
      if (next == null) {
        el.removeAttribute("style");
      } else {
        for (const styleName in next) {
          el.style[styleName] = next[styleName];
        }
        for (const styleName in prev) {
          if (!next.hasOwnProperty(styleName)) {
            el.style[styleName] = "";
          }
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
let activeEffect;
const effectStack = [];
function effect(fn, options = {}) {
  const effectFn = () => {
    try {
      activeEffect = effectFn;
      effectStack.push(effectFn);
      return fn();
    } finally {
      effectStack.pop();
      activeEffect = effectStack[effectStack.length - 1];
    }
  };
  if (!options.lazy) {
    effectFn();
  }
  effectFn.scheduler = options.scheduler;
  return effectFn;
}
const targetMap = /* @__PURE__ */ new WeakMap();
function track(target, key) {
  if (!activeEffect) {
    return;
  }
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, dep = /* @__PURE__ */ new Set());
  }
  dep.add(activeEffect);
}
function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  const dep = depsMap.get(key);
  if (!dep) {
    return;
  }
  dep.forEach((effectFn) => {
    if (effectFn.scheduler) {
      effectFn.scheduler(effectFn);
    } else {
      effectFn();
    }
  });
}
const proxyMap = /* @__PURE__ */ new WeakMap();
function reactive(target) {
  if (!isObject(target))
    return target;
  if (isReactive(target))
    return target;
  if (proxyMap.has(target))
    return proxyMap.get(target);
  const proxy = new Proxy(target, {
    /*
    Reflect
      - 反射
      - 作用：可以通过编程的方式操作对象
      - 语法：Reflect.xxx(target, key, value)
      - 用法就是和Object类似，但是Object具有局限性
      - 比如增加删除属性需要写try catch，而Reflect不需要 直接if else判断即可
      - 比如在object的key中不能是一个symbol，而Reflect可以
      Reflect 提供的是一整套反射能力 API，它们的调用方式，参数和返回值都是统一风格的，我们可以使用 Reflect 写出更优雅的反射代码。
    
    */
    get(target2, key, receiver) {
      const res = Reflect.get(target2, key, receiver);
      if (key === "__isReactive")
        return true;
      track(target2, key);
      return isObject(res) ? reactive(res) : res;
    },
    set(target2, key, value, receiver) {
      let oldLength = target2.length;
      const oldValue = target2[key];
      const res = Reflect.set(target2, key, value, receiver);
      if (haschanged(oldValue, value)) {
        trigger(target2, key);
        if (isArray(target2) && haschanged(oldLength, target2.length)) {
          trigger(target2, "length");
        }
      }
      return res;
    }
  });
  proxyMap.set(target, proxy);
  return proxy;
}
function isReactive(target) {
  return !!(target && target.__isReactive);
}
const queue = [];
let isFlushing = false;
const resolvedPromise = Promise.resolve();
let currentFlushPromise = null;
function nextTick(fn) {
  return fn ? (currentFlushPromise || resolvedPromise).then(fn) : currentFlushPromise || resolvedPromise;
}
function queueJob(job) {
  if (!queue.includes(job) || !queue.length) {
    queue.push(job);
    queueFlush();
  }
}
function queueFlush() {
  if (!isFlushing) {
    isFlushing = true;
    currentFlushPromise = resolvedPromise.then(flushJobs);
  }
}
function flushJobs() {
  try {
    for (let i = 0; i < queue.length; i++) {
      queue[i]();
    }
  } finally {
    isFlushing = false;
    queue.length = 0;
    currentFlushPromise = null;
  }
}
function updateProps(instance, vnode) {
  var _a;
  const { type: Component, props: vnodeProps } = vnode;
  const props = instance.props = {};
  const attrs = instance.attrs = {};
  for (const key in vnodeProps) {
    if ((_a = Component.props) == null ? void 0 : _a.includes(key)) {
      props[key] = vnodeProps[key];
    } else {
      attrs[key] = vnodeProps[key];
    }
  }
  instance.props = reactive(instance.props);
}
function mountComponent(vnode, container, anchor) {
  var _a;
  const { type: Component } = vnode;
  const instance = vnode.component = {
    props: {},
    attrs: {},
    setupState: null,
    subTree: null,
    ctx: null,
    update: null,
    isMounted: false,
    next: null
  };
  updateProps(instance, vnode);
  instance.setupState = (_a = Component.setup) == null ? void 0 : _a.call(Component, instance.props, {
    attrs: instance.attrs,
    slot: null,
    emit: null
  });
  instance.ctx = {
    ...instance.props,
    ...instance.setupState
  };
  instance.update = effect(
    () => {
      if (!instance.isMounted) {
        const subTree = instance.subTree = normalizeVNode(
          Component.render(instance.ctx)
        );
        fullThrough(instance, subTree);
        patch(null, subTree, container, anchor);
        instance.isMounted = true;
        vnode.el = subTree.el;
      } else {
        if (instance.next) {
          vnode = instance.next;
          instance.next = null;
          updateProps(instance, vnode);
          instance.ctx = {
            ...instance.props,
            ...instance.setupState
          };
        }
        const prev = instance.subTree;
        const subTree = instance.subTree = normalizeVNode(
          Component.render(instance.ctx)
        );
        fullThrough(instance, subTree);
        patch(prev, subTree, container, anchor);
        vnode.el = subTree.el;
      }
    },
    { scheduler: queueJob }
  );
}
function fullThrough(instance, subTree) {
  if (Object.keys(instance.attrs).length) {
    subTree.props = {
      ...subTree.props,
      ...instance.attrs
    };
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
  if (shapeFlag & ShapeFlags.COMPONENT) {
    processComponent(n1, n2, container, anchor);
  } else if (shapeFlag & ShapeFlags.TEXT) {
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
  if (shapeFlag & ShapeFlags.COMPONENT) {
    unmountComponent(vnode);
  } else if (shapeFlag & ShapeFlags.FRAGMENT) {
    unmountFragment(vnode);
  } else {
    el.parentNode.removeChild(el);
  }
}
function unmountComponent(vnode) {
  unmount(vnode.component.subTree);
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
function processComponent(n1, n2, container, anchor) {
  if (n1) {
    updateComponent(n1, n2);
  } else {
    mountComponent(n2, container, anchor);
  }
}
function updateComponent(n1, n2) {
  n2.component = n1.component;
  n2.component.next = n2;
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
      if (c1 && c1[0].key != null && c2 && c2[0].key != null) {
        patchKeyedChildren(c1, c2, container, anchor);
      } else {
        patchUnkeyedChildren(c1, c2, container, anchor);
      }
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
function patchUnkeyedChildren(c1, c2, container, anchor) {
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
function patchKeyedChildren(c1, c2, container, anchor) {
  let i = 0;
  let e1 = c1.length - 1;
  let e2 = c2.length - 1;
  while (i <= e1 && i <= e2 && c1[i].key === c2[i].key) {
    patch(c1[i], c2[i], container, anchor);
  }
  while (i <= e1 && i <= e2 && c1[e1].key === c2[e2].key) {
    patch(c1[e1], c2[e1], container, anchor);
    e1--;
    e2--;
  }
  if (i > e1) {
    for (let j = i; j <= e2; j++) {
      const nextPos = e2 + 1;
      const curAnchor = c2[nextPos] && c2[nextPos].el || anchor;
      path(null, c2[j], container, curAnchor);
    }
  } else if (i > e2) {
    for (let j = 1; j <= e1; j++) {
      unmount(c1[j]);
    }
  } else {
    const map = /* @__PURE__ */ new Map();
    c1.forEach((perv, j) => {
      map.set(perv.key, { perv, j });
    });
    let maxNewIndexSoFar = 0;
    let move = false;
    const source = new Array(e2 - i + 1).fill(-1);
    const toMounted = [];
    for (let k = 0; k < c2.length; k++) {
      const next = c2[k];
      if (map.has(next.key)) {
        const { prev, j } = map.get(next.key);
        patch(prev, next, container, anchor);
        if (j < maxNewIndexSoFar) {
          move = true;
        } else {
          maxNewIndexSoFar = j;
        }
        source[k] = j;
        map.delete(next.key);
      } else {
        toMounted.push(k + i);
      }
    }
    map.forEach(({ perv }) => unmount(perv));
    if (move) {
      const seq = getSequence(source);
      let j = seq.length - 1;
      for (let k = source.length - 1; k >= 0; k--) {
        if (k === seq[j]) {
          j--;
        } else {
          const pos = k + i;
          const nextPos = pos + 1;
          const curAnchor = c2[nextPos] && c2[nextPos].el || anchor;
          if (source[k] === -1) {
            patch(null, c2[pos], container, curAnchor);
          } else {
            container.insertBefore(c2[pos].el, curAnchor);
          }
        }
      }
    } else if (toMounted.length) {
      for (let k = toMounted.length - 1; k >= 0; k--) {
        const pos = toMounted[k];
        const nextPos = pos + 1;
        const curAnchor = c2[nextPos] && c2[nextPos].el || anchor;
        patch(null, c2[pos], container, curAnchor);
      }
    }
  }
}
function getSequence(nums) {
  const result = [];
  const position = [];
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === -1) {
      continue;
    }
    if (nums[i] > result[result.length - 1]) {
      result.push(nums[i]);
      position.push(result.length - 1);
    } else {
      let l = 0, r = result.length - 1;
      while (l <= r) {
        const mid = ~~((l + r) / 2);
        if (nums[i] > result[mid]) {
          l = mid + 1;
        } else if (nums[i] < result[mid]) {
          r = mid - 1;
        } else {
          l = mid;
          break;
        }
      }
      result[l] = nums[i];
      position.push(l);
    }
  }
  let cur = result.length - 1;
  for (let i = position.length - 1; i >= 0 && cur >= 0; i--) {
    if (position[i] === cur) {
      result[cur--] = i;
    }
  }
  return result;
}
function createApp(rootComponent) {
  const app = {
    mount(rootContainer) {
      if (isString(rootContainer)) {
        rootContainer = document.querySelector(rootContainer);
      }
      render(h(rootComponent), rootContainer);
    },
    use() {
    }
  };
  return app;
}
function ref(value) {
  if (isRef(value))
    return value;
  return new RefImpl(value);
}
function isRef(value) {
  return !!(value && value.__isRef);
}
class RefImpl {
  constructor(value) {
    this._value = convert(value);
    this.__isRef = true;
  }
  get value() {
    track(this, "value");
    return this._value;
  }
  set value(newValue) {
    if (haschanged(newValue, this._value)) {
      this._value = convert(newValue);
      trigger(this, "value");
    }
  }
}
function convert(value) {
  return isObject(value) ? reactive(value) : value;
}
createApp({
  setup() {
    const count = ref(0);
    const add = () => {
      count.value++;
      count.value++;
      count.value++;
    };
    return {
      count,
      add
    };
  },
  render(ctx) {
    console.log(ctx);
    return [
      h("div", { id: "div" }, ctx.count.value),
      h("button", { id: "btn", onClick: ctx.add }, "add")
    ];
  }
}).mount(document.body);
const div = document.getElementById("div");
const btn = document.getElementById("btn");
console.log(div.innerHTML);
btn.click();
console.log(div.innerHTML);
nextTick(() => {
  console.log(div.innerHTML);
});
