import Vue from "vue";

const hookFunctions = {
	bind: function(el, binding, vnode) {
		let animationCallbackId;
		el.resizeObserver = new ResizeObserver(entries => {
			// 判断 binding.modifiers 的属性，来判断模式
			if (binding.modifiers.animation) {
				cancelAnimationFrame(animationCallbackId);
				animationCallbackId = requestAnimationFrame(() => {
					vnode.context[binding.expression] = entries[0].contentRect;
				});
			} else {
				// vnode.context就是组件实例 - vm
				vnode.context[binding.expression] = entries[0].contentRect;
			}
		});
		el.resizeObserver.observe(el);
	},
	unbind: function(el) {
		el.resizeObserver && el.resizeObserver.disconnect();
	}
};

Vue.directive("useResizeObserver", hookFunctions);
