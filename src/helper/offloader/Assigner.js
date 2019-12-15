export default class Assigner {
	// 默认不赋值的话，实例上的 streamlineSymbol 是 undefined
	streamlineSymbol;
	// 已经排了班的 IdleCallback 或 AnimationFrame 都可以通过这个 id 进行 cancel 操作
	callbackExecutorId;
	// 已触发的 streamline 所对应的 promise 的 resolve 和 reject 对
	streamlinePromise;
	// 启动 streamline
	startStreamline(operate = () => {}, argumentsForOperate) {
		// stable this
		const stableThis = this;
		// 生成一个新的 Symbol 赋值给 streamlineSymbol
		const symbolForThisLine = Symbol();
		this.streamlineSymbol = symbolForThisLine;
		// 方法调用中的this指向调用人，父调指父，子调指子
		// operate的具体内容，由子类进行提供
		return new Promise(function(resolve, reject) {
			operate.call(stableThis, symbolForThisLine, resolve, reject, argumentsForOperate);
		});
	}
}
