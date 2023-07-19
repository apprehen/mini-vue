/**
 * activeEffect
 * - 当前正在执行的effect函数（跟踪当前正在执行的副作用函数）
 * - 作用：用于依赖收集
 */
let activeEffect
/*
effect(()=>{
  effect(()=>{
    console.log(1)
  }
  console.log(2)
})  //会丢失第一个effect函数
*/

// 使用栈记录effect函数
const effectStack = []
export function effect(fn, options = {}) {
	const effectFn = () => {
		try {
			activeEffect = effectFn
			effectStack.push(effectFn)
			// 访问响应式对象属性时会触发get函数，get函数中会调用track函数，track函数中会调用activeEffect函数
			return fn()
		} finally {
			effectStack.pop()
			activeEffect = effectStack[effectStack.length - 1]
		}
	}
	if (!options.lazy) {
		effectFn()
	}
	effectFn.scheduler = options.scheduler
	return effectFn
}

// 依赖收集
/**
 * Map
 * - 键值对的集合
 * - 比起传统的object对象，map的key可以是任意类型 也就是说是 value - value的集合
 * Map特点：
 *  - 不同于Object原型链 没有默认值。
 *  - Map 的键可以是任意类型数据，就连函数都可以。
 *  - Map 的键值对个数可以轻易通过size属性获取，Object 需要手动计算。
 *  - Map 在频繁增删键值对的场景下性能要比 Object 好。
 * Map方法：
 *  - set(key, value)：向 Map 中添加新数据。
 *  - get(key)：获取 Map 中的数据。不存在返回undefined。
 *  - has(key)：判断 Map 中是否存在指定的 key。返回boolean。
 *  - delete(key)：删除 Map 中指定 key 的数据。boolean。
 *  - clear()：清空 Map 中的所有数据。 无返回值。
 *  - size：获取 Map 中键值对的个数。
 * Map遍历（Map中含有iterator迭代器）：
 *  - keys()：返回键名的遍历器。
 *  - values()：返回键值的遍历器。
 *  - entries()：返回所有成员的遍历器。
 *  - forEach()：遍历 Map 的所有成员。
 * Map转化：
 *  - Map 转为数组：[...map]
 *  - 数组 转为 Map：new Map(arr.map(item => [item.key, item.value])
 *  - Map 转为对象：遍历 Map，将键名作为对象的属性名，键值作为对象的属性值，然后新建一个对象返回。
 */
/**
 * WeakMap
 * - 弱引用
 * - 作用：存储数据，key只能是对象(null除外)
 * 强引用：
 *  如果一个对象具有强引用，它就不会被垃圾回收机制回收。如果不强制回收，这个对象就会一直存在内存中，不会被回收。
 *  会造成内存泄漏
 * 弱引用：
 *  let obj = new WeakObject();
 *  可能会被垃圾回收机制回收
 *  WeakMap 保持了对键名所引用的对象的弱引用，即垃圾回收机制不将该引用考虑在内。
 *  只要所引用的对象的其他引用都被清除，垃圾回收机制就会释放该对象所占用的内存。
 *  也就是说，一旦不再需要，WeakMap 里面的键名对象和所对应的键值对会自动消失，不用手动删除引用。
 * - 不可遍历
 * Map 的键实际上是跟内存地址绑定的，只要内存地址不一样，就视为两个键；
 * WeakMap 的键是弱引用，键所指向的对象可以被垃圾回收，此时键是无效的
 * - 使用场景:
 *  DOM 节点元数据
 *  部署私有属性
 *  数据缓存  当我们需要在不修改原有对象的情况下储存某些属性等，而又不想管理这些数据时，可以使用WeakMap
 */
const targetMap = new WeakMap()
export function track(target, key) {
	if (!activeEffect) {
		return
	}
	// depsMap 依赖收集
	let depsMap = targetMap.get(target)
	if (!depsMap) {
		targetMap.set(target, (depsMap = new Map()))
	}
	let dep = depsMap.get(key)
	if (!dep) {
		depsMap.set(key, (dep = new Set()))
	}
	dep.add(activeEffect)
}

export function trigger(target, key) {
	const depsMap = targetMap.get(target)
	if (!depsMap) {
		return
	}
	const dep = depsMap.get(key)
	if (!dep) {
		return
	}
	dep.forEach((effectFn) => {
		// effect()
		if (effectFn.scheduler) {
			effectFn.scheduler(effectFn)
		} else {
			effectFn()
		}
	})
}
