import { isArray, isNumber, isString } from "../utils"
// ShapeFlags: 二进制位运算
export const ShapeFlags = {
	ELEMENT: 1,
	TEXT: 1 << 1,
	FRAGMENT: 1 << 2,
	COMPONENT: 1 << 3,
	TEXT_CHILDREN: 1 << 4,
	ARRAY_CHILDREN: 1 << 5,
	CHILDREN: (1 << 4) | (1 << 5),
}

// Text：类型Symbol
export const Text = Symbol("Text")
// Fragment：类型SymbolS
export const Fragment = Symbol("Fragment")

/**
 * vnode有四种类型：dom元素，纯文本，Fragment，组件
 * @param {string | Object | Text | Fragment} type
 * @param {Object | null} props
 * @param {String | Array | null | number} children
 * @returns {VNode}
 */

export function h(type, props, children) {
	let shapeFlag = 0
	if (isString(type)) {
		shapeFlag = ShapeFlags.ELEMENT
	} else if (type === Text) {
		shapeFlag = ShapeFlags.TEXT
	} else if (type === Fragment) {
		shapeFlag = ShapeFlags.FRAGMENT
	} else {
		shapeFlag = ShapeFlags.COMPONENT
	}
	if (isString(children) || isNumber(children)) {
		// a|=b ==>
		shapeFlag |= ShapeFlags.TEXT_CHILDREN
		children = children.toString()
	} else if (isArray(children)) {
		shapeFlag |= ShapeFlags.ARRAY_CHILDREN
	}
	return {
		type,
		props,
		children,
		shapeFlag,
		el: null,
		anchor: null,
	}
}
