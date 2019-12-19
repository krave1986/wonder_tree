<template>
	<div :class="$style.curtain" :style="curtainStyle" @transitionend.self.stop="resetVerticalTransitionOrNot">
		<component
			v-bind:is="treeFlatListComponent"
			tag="div"
			:class="$style.treeFlatList"
			v-use-resize-observer="transitionGroupDimensions"
		>
			<tree-node v-for="(listItem, index) in listItems" :key="index" :treeItem="listItem" />
		</component>
	</div>
</template>

<script>
import TreeNode from "./TreeNode";

export default {
	inheritAttrs: false,
	name: "TreeFlatList",
	components: {
		TreeNode
	},
	props: {
		listItems: {},
		parent: {},
		openOrCloseFromVModel: { type: Boolean, default: false }
	},
	model: {
		prop: "openOrCloseFromVModel",
		event: "toggle"
	},
	inject: {
		treeFlatListComponent: {
			default() {
				return "div";
			}
		},
		watchToBaseForTreeFlatList: {
			default() {
				return {};
			}
		},
		watchToHandlersForTreeFlatList: {
			default() {
				return {};
			}
		},
		beforeMountedForTreeFlatList: {
			default() {
				return function() {
					this.openOrClose = false;
				};
			}
		},
		afterMountedForTreeFlatList: {
			default() {
				return function() {};
			}
		},
		watchToId: {
			default() {
				return undefined;
			}
		},
		uniqueKey: {}
	},
	computed: {
		heightMark: function() {
			// 这个computed值，用于表示，当前处于 零高 还是 全高
			return this.openOrClose ? "full-height" : "zero-height";
		},
		transitionGroupHeight: function() {
			return this.transitionGroupDimensions.height;
		},
		fullHeightStyle: function() {
			return {
				height: this.transitionGroupHeight + "px"
			};
		},
		heightStyle: function() {
			return this.openOrClose ? this.fullHeightStyle : this.zeroHeightStyle;
		},
		verticalTransitionStyle: function() {
			return this.verticalTransitionOrNot
				? {
						transition: "var(--tree-flat-list-vertical-transition, height 1s ease-out)"
				  }
				: {};
		},
		curtainStyle: function() {
			return { ...this.heightStyle, ...this.verticalTransitionStyle };
		},
		openOrClose: {
			get() {
				return this.openOrCloseFromVModel;
			},
			set(nv) {
				this.$emit("toggle", nv);
			}
		}
	},
	watch: {
		openOrClose: function() {
			if (this.transitionGroupHeight !== 0) {
				this.verticalTransitionOrNot = true;
			}
		}
	},
	data() {
		return {
			unwatches: [],
			// openOrClose: true,
			itemsToBeDisplayed: [],
			migrationGen: {},
			transitionGroupDimensions: {},
			zeroHeightStyle: {
				height: "0"
			},
			verticalTransitionOrNot: false
		};
	},
	methods: {
		unwatchAll: function() {
			this.unwatches.forEach(unwatch => unwatch());
			this.unwatches = [];
		},
		resetVerticalTransitionOrNot: function() {
			this.verticalTransitionOrNot = false;
		}
	},
	created() {
		const vm = this;
		// 对注入的 handlers 的 keys 做迭代，对对应的内容做 watch 操作
		let handlersKeys = Object.keys(vm.watchToHandlersForTreeFlatList);
		// 对 handlersKeys 再做一波基于 watchToId 的过滤
		handlersKeys = handlersKeys.filter(key => {
			return (
				typeof vm.watchToHandlersForTreeFlatList[key] === "function" ||
				vm.watchToHandlersForTreeFlatList[key].id === undefined ||
				vm.watchToHandlersForTreeFlatList[key].id === vm.watchToId
			);
		});
		const baseKeys = Object.keys(vm.watchToBaseForTreeFlatList);
		const restHandlerKeys = handlersKeys.filter(handlerKey => {
			if (baseKeys.includes(handlerKey)) {
				vm.unwatches.push(
					vm.$watch(
						`watchToBaseFor${vm.$options.name}.` + handlerKey,
						vm[`watchToHandlersFor${vm.$options.name}`][handlerKey].handler ||
							vm[`watchToHandlersFor${vm.$options.name}`][handlerKey],
						vm[`watchToHandlersFor${vm.$options.name}`][handlerKey].options || {}
					)
				);
				return;
			}
			return true;
		});
		// 为 watchToBase 中不存在的 属性 添加 watch 组件属性的 watcher
		restHandlerKeys.forEach(handlerKey => {
			vm.unwatches.push(vm.$watch(handlerKey, vm[`watchToHandlersFor${vm.$options.name}`][handlerKey]));
		});
		// 调用 beforeMounted 的 注入钩
		vm.beforeMountedForTreeFlatList();
	},
	mounted() {
		// 调用 afterMounted 的 注入钩
		this.afterMountedForTreeFlatList();
	},
	destroyed() {
		this.unwatchAll();
	}
};
</script>

<style module>
.curtain {
	color: rebeccapurple;
	overflow: hidden;
	will-change: height;
	contain: paint size layout style;
}
.treeFlatList {
	background: burlywood;
}
</style>
