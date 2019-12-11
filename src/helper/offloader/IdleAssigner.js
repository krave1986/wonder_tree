import Assigner from "./Assigner";
import getPropertyFromString from "../getPropertyFromString";

function operate(symbol, resolve, reject, { gen, timeout, backpacker, bag }) {
	// 我希望：尽量利用 requestIdleCallback 来运行 gen ，
	// 并在 timeout 达到之前，尽可能完成整个 gen 的运行。
	// 声明 idleHandler 让 requestIdleCallback 进行调用
	// 用 yieldResult 存放每次 gen.next() 的结果，包括 gen 的返回值：最后一次next()的结果
	let yieldResult;
	console.log(symbol === this.streamlineSymbol, "SYMBBBBBB");

	debugger;
	gen, timeout, backpacker, bag;
	function idleHandler(deadline) {
		const genStart = Date.now();
		// 只要 gen 没有 done，timeRemaining 还有时间，didTimeout 没到，就持续执行循环语句
		while ((yieldResult = gen.next()).done === false && (deadline.timeRemaining() > 3 || deadline.didTimeout)) {
			if (symbol !== this.streamlineSymbol) {
				reject(
					`Task aborted at - Cache: ${yieldResult.value.payload.cachePointer} List: ${yieldResult.value.payload.listPointer}`
				);
				return;
			}
			// 这个while循环的函数体其实没有意义，因为每次迭代的大部分内容就是去调用gen的next方法
			// 之后可以传入条件，来判断是否要 break 掉循环，或是进行其它操作。
		}
		const genEnd = Date.now();
		// 到这一步，已经出了while循环。如果 yieldResult.done === false，
		// 表示 gen 还没运行完，给的 timeout 也还有时间，只是当前 idle tick 没时间了。
		// 需要再排一个 idleCallback 才能让 gen 执行完.
		if (yieldResult.done === false) {
			timeout = Math.max(timeout - genEnd + genStart, 1);
			console.log("OUT!!!! +++++++++++++++++", timeout);
			// 判断是不是 urgent ，urgent 的话，
			getPropertyFromString(backpacker, bag) === true
				? requestIdleCallback(idleHandler, { timeout: 1 })
				: requestIdleCallback(idleHandler, { timeout });
		} else resolve(yieldResult.value);
	}
	getPropertyFromString(backpacker, bag) === true
		? requestIdleCallback(idleHandler, { timeout: 1 })
		: requestIdleCallback(idleHandler, { timeout });
}

export default class IdleAssigner extends Assigner {
	constructor() {
		super();
	}
	assign(gen, timeout, backpacker, bag) {
		this.startStreamline(operate, { gen, timeout, backpacker, bag });
	}
}
