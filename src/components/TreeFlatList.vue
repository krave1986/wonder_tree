<template>
	<div ref="curtain" :class="$style.curtain" :style="curtainStyle" @transitionend.self.stop="postTransitionOperations">
		<component ref="listEntity" v-bind:is="treeFlatListComponent" tag="div" :class="$style.treeFlatList">
			<tree-node v-for="(listItem, index) in listItems" :key="index" :treeItem="listItem">
				<template v-for="slotName in Object.keys($scopedSlots)" #[slotName]="scope">
					<slot :name="slotName" v-bind="scope"></slot>
				</template>
			</tree-node>
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
		openOrCloseFromVModel: { type: Boolean, default: false }
	},
	model: {
		prop: "openOrCloseFromVModel",
		event: "toggle"
	},
	inject: {
		customizedListeners: {},
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
		listenersForVOn: function() {
			const vm = this;
			const filteredListeners = this.customizedListeners.filter(
				l => l.forComponent.replace(/\B(?=[A-Z])/g, "-") === vm.$options._componentTag || l.successive === true
			);
			// filteredListeners 中，即包含了 forComponent 匹配当前组件名的监听器，
			// 又包含了 succesive: true 的监听器
			// 接下来，需要获取的是，二元entries，
			const listenerEntries = filteredListeners.map(l => {
				if (l.forComponent === vm.$options._componentTag) {
					return [
						l.event,
						function(input) {
							const output = l.handler.call(this, input);
							if (l.successive === true) {
								this.$emit(l.event, output);
							}
						}
					];
				} else {
					// TODO
					this.$emit(l.event);
				}
			});
			return filteredListeners;
		},
		fullHeightStyle: function() {
			return {
				height: this.transitionGroupHeight + "px"
			};
		},
		heightStyle: function() {
			switch (this.heightStatus) {
				case "full":
					return this.fullHeightStyle;
				case "zero":
					return this.zeroHeightStyle;
				default:
					return {};
			}
		},
		verticalTransitionStyle: function() {
			return this.verticalTransitionOrNot
				? {
						transition: "var(--tree-flat-list-vertical-transition, height 800ms ease-out)"
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
		async openOrClose(nv) {
			if (nv === true) {
				await this.updateTransitionGroupHeight();
				this.heightStatus = "full";
			} else {
				if (this.heightStatus === "natural") {
					// 如果当前当 status 是 natural 的话，
					// 先将 status 设为 full， 然后再将 status 设为 zero
					await this.updateTransitionGroupHeight();
					this.heightStatus = "full";
					const vm = this;
					setTimeout(() => {
						vm.heightStatus = "zero";
					}, 80);
				} else {
					this.heightStatus = "zero";
				}
			}
		},
		listItems: function() {
			this.updateTransitionGroupHeight();
		}
	},
	data() {
		return {
			listInstance: this,
			unwatches: [],
			transitionGroupHeight: 0,
			itemsToBeDisplayed: [],
			migrationGen: {},
			transitionGroupDimensions: {},
			zeroHeightStyle: {
				height: "0"
			},
			verticalTransitionOrNot: true,
			// deferMark 用于处在自然状态下的菜单，在缩起来时，需要先将 height 定位成当前的高度，
			// 再变成 height: 0
			deferMark: true,
			// heightStatus分为3种：zero，full，natural
			heightStatus: this.openOrCloseFromVModel === true ? "full" : "zero"
		};
	},
	methods: {
		updateTransitionGroupHeight: function() {
			const vm = this;
			return vm.$nextTick().then(function() {
				vm.transitionGroupHeight = vm.$refs.listEntity.scrollHeight;
			});
		},
		unwatchAll: function() {
			this.unwatches.forEach(unwatch => unwatch());
			this.unwatches = [];
		},
		postTransitionOperations: function() {
			if (this.$refs.curtain.clientHeight !== 0) {
				this.heightStatus = "natural";
			}
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
	contain: paint layout style;
}
.treeFlatList {
	background: burlywood;
}
</style>
