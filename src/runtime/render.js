import { ShapeFlags } from "./vnode"
import { patchProps } from "./patchProps"

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

function mountText(vnode, container, anchor) {
	const textNode = document.createTextNode(vnode.children)
	vnode.el = textNode
	container.insertBefore(textNode, anchor)
}

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
	//TODO
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
	// TODO
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
			patchArrayChildren(c1, c2, container, anchor)
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

function patchArrayChildren(c1, c2, container, anchor) {
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

function isSameVNode(prevVNode, vnode) {
	return prevVNode.type === vnode.type
}
