let activeEffect;
const effectStack = [];
function effect(fn) {
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
  effectFn();
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
  dep.forEach((effect2) => {
    effect2();
  });
}
function isObject(val) {
  return typeof val === "object" && val !== null;
}
function haschanged(oldValue, newValue) {
  return oldValue !== newValue && !(Number.isNaN(oldValue) && Number.isNaN(newValue));
}
function isArray(target) {
  return Array.isArray(target);
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
window.observed = reactive({ count: 0 });
const foo = window.foo = ref(1);
effect(() => {
  console.log("EXPLOSIONING " + foo.value);
});
