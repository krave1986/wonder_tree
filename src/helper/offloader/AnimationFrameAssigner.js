import Assigner from "./Assigner";

function operate(symbol, resolve, reject, { gen }) {
	let yieldResult;
	const stableThis = this;
	// 让 requestAnimationFrame 可以取消，需要留下cb的id
	function requestRecordedAnimationFrame(stableThis, handler) {
		cancelAnimationFrame(stableThis.callbackExecutorId);
		stableThis.callbackExecutorId = requestAnimationFrame(handler);
	}
	function animationHandler() {
		// 如果 yieldResult.done 为 false，说明gen没走完
		if ((yieldResult = gen.next()).done === false) {
			if (stableThis.streamlineSymbol !== symbol) {
				// 通过 symbol 来停止 gen.next() 的调用
				reject(`Animation aborted at ${yieldResult.value}`);
			} else {
				requestRecordedAnimationFrame(stableThis, animationHandler);
			}
		} else {
			resolve(yieldResult.value);
		}
	}
	requestRecordedAnimationFrame(stableThis, animationHandler);
}

export default class AnimationFrameAssigner extends Assigner {
	constructor() {
		super();
	}
	assign(gen, duration) {
		return this.startStreamline(operate, { gen, duration });
	}
}
