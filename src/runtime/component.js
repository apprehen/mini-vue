import { reactive } from "../reactive/reactive"
import { effect } from "../reactive/effect"
import { patch } from "./render"
import { normalizeVNode } from "./vnode"
import { queueJob } from "./scheduler"
function updateProps(instance, vnode) {
	const { type: Component, props: vnodeProps } = vnode
	const props = (instance.props = {})
	const attrs = (instance.attrs = {})
	for (const key in vnodeProps) {
		if (Component.props?.includes(key)) {
			props[key] = vnodeProps[key]
		} else {
			attrs[key] = vnodeProps[key]
		}
	}
	// toThink: props源码是shallowReactive，确实需要吗?
	// 需要。否则子组件修改props不会触发更新
	instance.props = reactive(instance.props)
}
export function mountComponent(vnode, container, anchor) {
	const { type: Component } = vnode
	const instance = (vnode.component = {
		props: {},
		attrs: {},
		setupState: null,
		subTree: null,
		ctx: null,
		update: null,
		isMounted: false,
		next: null,
	})
	// setupComponent
	updateProps(instance, vnode)
	// 源码：instance.setupState = proxyRefs(setupResult)
	instance.setupState = Component.setup?.(instance.props, {
		attrs: instance.attrs,
		slot: null,
		emit: null,
	})
	instance.ctx = {
		...instance.props,
		...instance.setupState,
	}
	instance.update = effect(
		() => {
			if (!instance.isMounted) {
				// mount
				const subTree = (instance.subTree = normalizeVNode(
					Component.render(instance.ctx)
				))
				fullThrough(instance, subTree)
				patch(null, subTree, container, anchor)
				instance.isMounted = true
				vnode.el = subTree.el
			} else {
				if (instance.next) {
					// 被动更新
					vnode = instance.next
					instance.next = null
					updateProps(instance, vnode)
					instance.ctx = {
						...instance.props,
						...instance.setupState,
					}
				}
				const prev = instance.subTree
				const subTree = (instance.subTree = normalizeVNode(
					Component.render(instance.ctx)
				))
				fullThrough(instance, subTree)
				patch(prev, subTree, container, anchor)
				vnode.el = subTree.el
			}
		},
		{ scheduler: queueJob }
	)
}

function fullThrough(instance, subTree) {
	if (Object.keys(instance.attrs).length) {
		subTree.props = {
			...subTree.props,
			...instance.attrs,
		}
	}
}
