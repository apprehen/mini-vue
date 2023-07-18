import { ShapeFlags } from "./vnode"
import { patchProps } from "./patchProps"
import { mountComponent } from "./component"
export function render(vnode, container) {
	const prevVNode = container._vnode
	// first：判断n2是否存在
	if (!vnode) {
		if (prevVNode) {
			unmount(prevVNode)
		}
	} else {
		// n2存在
		patch(prevVNode, vnode, container)
	}
	// mount(vnode,container)
	container._vnode = vnode
}

/**
 * @param {VNode | null} n1:旧的vnode
 * @param {VNode} n2:新的vnode
 * @param {Element} container:容器
 * @param {Element | null} anchor:锚点 (插入位置)
 */
function patch(n1, n2, container, anchor) {
	if (n1 && !isSameVNode(n1, n2)) {
		anchor = (n1.anchor || n1.el).nextSibling
		unmount(n1)
		n1 = null
	}
	const { shapeFlag } = n2
	if (shapeFlag & ShapeFlags.COMPONENT) {
		processComponent(n1, n2, container, anchor)
	} else if (shapeFlag & ShapeFlags.TEXT) {
		processText(n1, n2, container, anchor)
	} else if (shapeFlag & ShapeFlags.FRAGMENT) {
		processFragment(n1, n2, container, anchor)
	} else {
		processElement(n1, n2, container, anchor)
	}
}

/**
 * @param {VNode} vnode: vnode DOM节点
 * @param {Element} container:容器
 * @param {Element | null} anchor:锚点 (插入位置)
 * @apprehen 挂载元素
 */
function mountElement(vnode, container, anchor) {
	const { type, props, shapeFlag, children } = vnode
	const el = document.createElement(type)
	// 挂载属性
	if (props) {
		patchProps(null, props, el)
	}
	// 挂载子节点
	if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
		el.textContent = children
	} else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
		mountChildren(children, el)
	}
	vnode.el = el
	container.insertBefore(el, anchor)
}

/**
 * @param {VNode} vnode:vnode DOM节点
 * @param {Element} container:容器
 * @param {Element | null} anchor:锚点 (插入位置)
 * @apprehen 挂载文本
 */
function mountText(vnode, container, anchor) {
	const textNode = document.createTextNode(vnode.children)
	vnode.el = textNode
	container.insertBefore(textNode, anchor)
}

/**
 * @param {Array<VNode>} children:children DOM节点数组 分别挂载
 * @param {Element} container:容器
 * @param {Element | null} anchor:锚点 (插入位置)
 * @apprehen 挂载子节点(数组类型)
 */
function mountChildren(children, container, anchor) {
	children.forEach((child) => patch(null, child, container, anchor))
}

function unmount(vnode) {
	// 判断组件类型
	const { shapeFlag, el } = vnode
	if (shapeFlag & ShapeFlags.COMPONENT) {
		unmountComponent(vnode)
	} else if (shapeFlag & ShapeFlags.FRAGMENT) {
		unmountFragment(vnode)
	} else {
		el.parentNode.removeChild(el)
	}
}

function unmountComponent(vnode) {
	//简易版
	unmount(vnode.component.subTree)
}

function unmountFragment(vnode) {
	const { el: cur, anchor: end } = vnode
	const { parentNode } = cur
	while (cur !== end) {
		let next = cur.nextSibling
		parentNode.removeChild(cur)
		cur = next
	}
	parentNode.removeChild(end)
}

function processElement(n1, n2, container, anchor) {
	if (n1 == null) {
		mountElement(n2, container, anchor)
	} else {
		patchElement(n1, n2)
	}
}

function processFragment(n1, n2, container, anchor) {
	const fragmentStartAnchor = (n2.el = n1 ? n1.el : document.createTextNode(""))
	const fragmentEndAnchor = (n2.anchor = n1
		? n1.anchor
		: document.createTextNode(""))
	if (n1 == null) {
		container.insertBefore(fragmentStartAnchor, anchor)
		container.insertBefore(fragmentEndAnchor, anchor)
		mountChildren(n2.children, container, fragmentEndAnchor)
	} else {
		patchChildren(n1, n2, container, fragmentEndAnchor)
	}
}

function processComponent(n1, n2, container, anchor) {
	if (n1) {
		// shouldComponentUpdate
		updateComponent(n1, n2, container)
	} else {
		mountComponent(n2, container, anchor)
	}
}

function updateComponent(n1, n2) {
	n2.component = n1.component
	n2.component.next = n2
}

function processText(n1, n2, container, anchor) {
	if (n1 == null) {
		mountText(n2, container, anchor)
	} else {
		n2.el = n1.el
		n2.el.textContent = n2.children
	}
}

function unmountChildren(children) {
	children.forEach((child) => unmount(child))
}

// 比较复用方法
function patchElement(n1, n2) {
	n2.el = n1.el
	patchProps(n1.props, n2.props, n2.el)
	patchChildren(n1, n2, n2.el)
}

function patchChildren(n1, n2, container, anchor) {
	const { shapeFlag: prevShapeFlag, children: c1 } = n1
	const { shapeFlag, children: c2 } = n2
	if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
		// n2 是TEXT_CHILDREN 类型
		if (c2 !== c1) {
			container.textContent = c2
		}
		if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
			unmountChildren(c1)
		}
	} else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
		// n2 是ARRAY_CHILDREN 类型
		if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
			// n1 是TEXT_CHILDREN 类型
			container.textContent = ""
			mountChildren(c2, container, anchor)
		} else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
			// n1 是ARRAY_CHILDREN 类型
			// diff 比较
			// 只要第一个元素有key,则后面都有Key
			if (c1 && c1[0].key != null && c2 && c2[0].key != null) {
				patchKeyedChildren(c1, c2, container, anchor)
			} else {
				patchUnkeyedChildren(c1, c2, container, anchor)
			}
		} else {
			// n1 是EMPTY_CHILDREN 类型 null
			mountChildren(c2, container, anchor)
		}
	} else {
		// n2 是EMPTY_CHILDREN 类型 null
		if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
			// n1 是TEXT_CHILDREN 类型
			container.textContent = ""
		} else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
			// n1 是ARRAY_CHILDREN 类型
			unmountChildren(c1)
		}
	}
}

//简单的diff比较
function patchUnkeyedChildren(c1, c2, container, anchor) {
	const oldLength = c1.length
	const newLength = c2.length
	const commonLength = Math.min(oldLength, newLength)
	for (let i = 0; i < commonLength; i++) {
		patch(c1[i], c2[i], container, anchor)
	}
	if (oldLength > newLength) {
		unmountChildren(c1.slice(commonLength))
	} else {
		mountChildren(c2.slice(commonLength), container, anchor)
	}
}

// react中的diff算法原理
function patchKeyedChildren(c1, c2, container, anchor) {
	const map = new Map()
	c1.forEach((perv, j) => {
		map.set(perv.key, { perv, j })
	})
	let maxNewIndexSoFar = 0
	for (let i = 0; i < c2.length; i++) {
		const next = c2[i]
		const curAnchor = i - 1 < 0 ? c1[0].el : c2[i - 1].el.nextSibling
		if (map.has(next.key)) {
			const { prev, j } = map.get(next.key)
			patch(prev, next, container, anchor)
			if (j < maxNewIndexSoFar) {
				container.insertBefore(next.el, curAnchor)
			} else {
				maxNewIndexSoFar = j
			}
			map.delete(next.key)
		} else {
			patch(null, next, container, curAnchor)
		}
	}
	map.forEach(({ perv }) => unmount(perv))
}

function isSameVNode(prevVNode, vnode) {
	return prevVNode.type === vnode.type
}

function patchKeyedChildren(c1, c2, container, anchor) {
	let i = 0
	let e1 = c1.length - 1
	let e2 = c2.length - 1
	// 1.从左到右依次对比
	while (i <= e1 && i <= e2 && c1[i].key === c2[i].key) {
		patch(c1[i], c2[i], container, anchor)
	}
	// 2.从右向左依次对比
	while (i <= e1 && i <= e2 && c1[e1].key === c2[e2].key) {
		patch(c1[e1], c2[e1], container, anchor)
		e1--
		e2--
	}

	// c1: a b c
	// c2: a d c b
	// i = 1
	// e1 = 2-->0
	// e2 = 3-->1
	if (i > e1) {
		// 3. 经过1,2 直接将旧结点比对完，则剩下的新结点直接mount
		for (let j = i; j <= e2; j++) {
			const nextPos = e2 + 1
			const curAnchor = (c2[nextPos] && c2[nextPos].el) || anchor
			path(null, c2[j], container, curAnchor)
		}
	} else if (i > e2) {
		// 3. 经过1,2 直接将新结点比对完，则剩下的旧结点直接unmount
		for (let j = 1; j <= e1; j++) {
			unmount(c1[j])
		}
	} else {
		// a b c d f e
		// a c d b g e
		// i = 1
		// e1 = 5 --> 4
		// e2 = 5 --> 4
		// 4. 若不满足3 采用传统的diff算法 但是不真的移动和添加，只做标记和删除
		const map = new Map()
		c1.forEach((perv, j) => {
			map.set(perv.key, { perv, j })
		})
		let maxNewIndexSoFar = 0
		let move = false
		const source = new Array(e2 - i + 1).fill(-1)
		const toMounted = []
		for (let k = 0; k < c2.length; k++) {
			const next = c2[k]
			if (map.has(next.key)) {
				const { prev, j } = map.get(next.key)
				patch(prev, next, container, anchor)
				if (j < maxNewIndexSoFar) {
					move = true
				} else {
					maxNewIndexSoFar = j
				}
				source[k] = j
				map.delete(next.key)
			} else {
				toMounted.push(k + i)
			}
		}
		map.forEach(({ perv }) => unmount(perv))
		if (move) {
			// 5.需要移动，采用新的最长上升子序列算法
			const seq = getSequence(source)
			let j = seq.length - 1
			for (let k = source.length - 1; k >= 0; k--) {
				const pos = k + i
				const nextPos = pos + 1
				const curAnchor = (c2[nextPos] && c2[nextPos].el) || anchor
				if (source[k] == -1) {
					// mount
					patch(null, c2[pos], container, curAnchor)
				} else if (seq[j] === k) {
					// 不用移动
					j--
				} else {
					// 移动
					container.insertBefore(c2[pos].el, curAnchor)
				}
			}
		} else if (toMounted.length) {
			for (let k = toMounted.length - 1; k >= 0; k--) {
				const pos = toMounted[k]
				const nextPos = pos + 1
				const curAnchor = (c2[nextPos] && c2[nextPos].el) || anchor
				path(null, c2[pos], container, curAnchor)
			}
		}
	}
}

// [10,9,2,5,101,3,7,18] -> 求最长子序列
// [1,1,1,2,3,2,3,4]
function getSequence(source) {}

// the first
const lengthOfLTS = function (nums) {
	const dp = new Array(nums.length).fill(1)
	let max = 1
	for (let i = 0; i < nums.length; i++) {
		for (let j = 0; j <= i; j++) {
			if (nums[i] > nums[j]) {
				// 前面的数比后面的数小不此一次 即判断
				dp[i] = Math.max(dp[i], dp[j] + 1)
			}
		}
		max = Math.max(max, dp[i])
	}
	return max
}

const lengthOfLTSSec = function (nums) {
	const arr = [nums[0]]
	// 记录arr中添加的每个数的位置
	const position = []
	for (let i = 1; i < nums.length; i++) {
		if (nums[i] > arr[arr.length - 1]) {
			arr.push(nums[i])
			position.push(arr.length - 1)
		} else {
			// 线性查找
			for (let j = 0; j < arr.length; j++) {
				// 找到第一个大于等于nums[i]的数，替换掉
				if (arr[j] >= nums[i]) {
					arr[j] = nums[i]
					position.push(j)
					break
				}
			}

			// 采用二分查找
			// let left = 0
			// let right = arr.length - 1
			// while (left < right) {
			// 	const mid = (left + right) >> 1
			// 	if (arr[mid] < nums[i]) {
			// 		left = mid + 1
			// 	} else {
			// 		right = mid
			// 	}
			// }
			// arr[left] = nums[i]
		}
	}
	let cur = arr.length - 1
	for (let i = position.length - 1; i >= 0; i--) {
		if (position[i] === cur) {
			arr[cur] = i
			cur--
		}
	}
	return {
		arr: arr,
		length: arr.length,
		position: position,
	}
}

// const res = lengthOfLTSSec([10, 9, 2, 5, 3, 7, 101, 18])

// console.log(res)
