import Assigner from "./Assigner";

function operate(symbol) {
	// 我希望：尽量利用 requestIdleCallback 来运行 gen ，
	// 并在 timeout 达到之前，尽可能完成整个 gen 的运行。
	// 声明 idleHandler 让 requestIdleCallback 进行调用
	// 用 yieldResult 存放每次 gen.next() 的结果，包括 gen 的返回值：最后一次next()的结果
	let yieldResult;
	console.log(symbol === this.streamlineSymbol, "SYMBBBBBB");
}

export default class IdleAssigner extends Assigner {
	constructor() {
		super();
	}
	assign(gen, timeout, backpacker, bag) {
		this.startStreamline(operate, gen, timeout, backpacker, bag);
	}
}
