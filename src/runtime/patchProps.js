import { isBoolean } from "../utils"
const domPropsRE = /\[A-Z]|^(?:value|checked|selected|muted)$/
export function patchProps(oldProps, newProps, el) {
	if (oldProps === newProps) {
		return
	}
	oldProps = oldProps || {}
	newProps = newProps || {}
	for (const key in newProps) {
		const prev = oldProps[key]
		const next = newProps[key]
		if (prev !== next) {
			patchDomProp(prev, next, key, el)
		}
	}
	for (const key in oldProps) {
		if (newProps[key] == null) {
			patchDomProp(oldProps[key], null, key, el)
		}
	}
}

function patchDomProp(prev, next, key, el) {
	switch (key) {
		case "class":
			el.className = next || ""
			break
		case "style":
			if (next == null) {
				el.removeAttribute("style")
			} else {
				for (const styleName in next) {
					el.style[styleName] = next[styleName]
				}
				for (const styleName in prev) {
					if (!next.hasOwnProperty(styleName)) {
						el.style[styleName] = ""
					}
				}
			}
			break
		default:
			if (/^on[^a-z]/.test(key)) {
				const eventName = key.slice(2).toLowerCase()
				if (prev) {
					el.removeEventListener(eventName, prev)
				}
				if (next) {
					el.addEventListener(eventName, next)
				}
			} else if (domPropsRE.test(key)) {
				if (next === "" && isBoolean(el[key])) {
					el[key] = true
				}
				el[key] = next
				break
			} else {
				if (next == null || next === false) {
					el.removeAttribute(key)
				} else {
					el.setAttribute(key, next)
				}
			}
	}
}
