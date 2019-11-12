import Vue from "vue";

const hookFunctions = {
	bind: function(el, binding, vnode) {
		el.resizeObserver = new ResizeObserver(entries => {
			// vnode.context就是组件实例 - vm
			vnode.context[binding.expression] = entries[0].contentRect;
		});
		el.resizeObserver.observe(el);
	},
	unbind: function(el) {
		el.resizeObserver && el.resizeObserver.disconnect();
	}
};

Vue.directive("useResizeObserver", hookFunctions);
