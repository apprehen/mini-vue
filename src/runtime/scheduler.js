const queue = []
let isFlushing = false
const resolvedPromise = Promise.resolve()
let currentFlushPromise = null

export function nextTick(fn) {
	return fn
		? (currentFlushPromise || resolvedPromise).then(fn)
		: currentFlushPromise || resolvedPromise
}

export function queueJob(job) {
	// 如果队列中没有这个job，或者队列为空，就把job推入队列
	if (!queue.includes(job) || !queue.length) {
		queue.push(job)
		queueFlush()
	}
}

function queueFlush() {
	if (!isFlushing) {
		isFlushing = true
		currentFlushPromise = resolvedPromise.then(flushJobs)
	}
}

function flushJobs() {
	try {
		for (let i = 0; i < queue.length; i++) {
			queue[i]()
		}
	} finally {
		isFlushing = false
		queue.length = 0
		currentFlushPromise = null
	}
}
