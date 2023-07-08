import { isObject,haschanged,isArray } from "../utils";
import { track,trigger } from "./effect";
const proxyMap = new WeakMap()
export function reactive(target) {
  // 1. 判断当前传入的target是否是对象和数组
  if (!isObject(target)) return target
  if (isReactive(target)) return target
  if (proxyMap.has(target)) return proxyMap.get(target)
  // 2. 对数组和对象中的所有数据进行reactive处理
  const proxy =  new Proxy(target, {
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
    get(target, key, receiver) {
      const res = Reflect.get(target, key, receiver)
      if(key==='__isReactive') return true
      track(target, key)
      return isObject(res) ? reactive(res) : res
    },
    set(target, key, value, receiver) {
      let oldLength = target.length
      const oldValue = target[key]
      const res = Reflect.set(target, key, value, receiver)
      if(haschanged(oldValue, value)){
        trigger(target, key)
        if (isArray(target) && haschanged(oldLength, target.length)) {
          trigger(target, 'length')
        }
      }
      return res
    }
  })
  proxyMap.set(target, proxy)
  return proxy
}

// 多次代理
export function isReactive(target) {
  return !!(target && target.__isReactive)
}