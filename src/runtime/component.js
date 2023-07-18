import { reactive } from "../reactive/reactive"
import { effect } from "../reactive/effect"
import { patch } from "./render"
import { nomalizeVNode } from "./vnode"
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
	instance.props = reactive(instance.props)
}
export function mountComponent(vnode, container, anchor) {
	const { type: Component } = vnode
	const instance = (vnode.component = {
		props: null,
		attrs: null,
		setupState: null,
		subTree: null,
		ctx: null,
		update: null,
		isMounted: false,
		next: null,
	})
	updateProps(instance, vnode)
	instance.setupState = Component.setup?.(instance.props, {
		attrs: instance.attrs,
		slot: null,
		emit: null,
	})
	instance.ctx = {
		...instance.props,
		...instance.setupState,
	}
	instance.mount = () => {
		const subTree = (instance.subTree = nomalizeVNode(
			Component.render(instance.ctx)
		))
		if (Object.keys(instance.attrs).length) {
			subTree.props = {
				...subTree.props,
				...instance.attrs,
			}
		}
		patch(null, subTree, container, anchor)
	}
	instance.mount()
	instance.update = effect(() => {
		if (!isMounted) {
			// mount
			const subTree = (instance.subTree = nomalizeVNode(
				Component.render(instance.ctx)
			))
			fullThrough(instance, subTree)
			patch(null, subTree, container, anchor)
			vnode.el = subTree.el
			instance.isMounted = true
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
			const subTree = (instance.subTree = nomalizeVNode(
				Component.render(instance.ctx)
			))
			fullThrough(instance, subTree)
			patch(prev, subTree, container, anchor)
			vnode.el = subTree.el
		}
	})
}

function fullThrough(instance, subTree) {
	if (Object.keys(instance.attrs).length) {
		subTree.props = {
			...subTree.props,
			...instance.attrs,
		}
	}
}
