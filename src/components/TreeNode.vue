<template>
	<div :class="wholeNodeClass" @click.stop="drawOff">
		<div :class="$style.leftSlot">
			<slot name="left" v-bind="nodeInstance">
				<svg
					class="icon"
					aria-hidden="true"
					style="transition: transform 0.6s"
					:style="{ transform: 'rotate(' + (openOrClose ? '90deg' : '0deg') + ')' }"
				>
					<use xlink:href="#iconzhixiang-1"></use>
				</svg>
			</slot>
		</div>
		<div :class="$style.nodeMain + nodeMainClass">
			<div :class="$style.nodeContent">
				<slot name="content" v-bind="nodeInstance">
					{{ treeItem.label }}
				</slot>
			</div>
			<tree-flat-list v-on="listenersForVOn" :listItems="listItems" v-model="openOrClose" v-bind="customVBinding()">
				<template v-for="slotName in Object.keys($scopedSlots)" #[slotName]="scope">
					<slot :name="slotName" v-bind="scope"></slot>
				</template>
			</tree-flat-list>
		</div>
	</div>
</template>

<script>
import Offloader from "../helper/offloader/Offloader";

const componentName = "TreeNode";

function* migrator(step, snapshots, vm) {
	if (snapshots.length === 0) {
		return;
	}
	if (step === "all") {
		step = snapshots.length;
	}
	function* migrate(index) {
		const indexInAction = Math.min(index, snapshots.length - 1);
		vm.childrenCache = snapshots[indexInAction] ? snapshots[indexInAction].result : [];
		// 赋值完成后，如果 indexInAction 等于 snapshots.length - 1
		// 则说明最后一个镜像已经赋值完毕，否则，继续迁移下一个镜像对象
		if (indexInAction !== snapshots.length - 1) {
			yield indexInAction;
			yield* migrate(index + step);
		}
	}
	const index = step - 1;
	yield* migrate(index);
}

function* getSnapshotWhenSyncingTwoArrays(target, reference = [], uniqueKey) {
	// 比较方法，纯粹比较相同还是不同
	function compare(a, b) {
		// 如果传入了 uniqueKey 的话，则比较 uniqueKey 属性的值
		if (uniqueKey) {
			return a[uniqueKey] === b[uniqueKey];
		} else return a === b;
	}
	// 检查 循环是否已经结束
	function checkWhetherLoopOver() {
		// 如果 cachePointer 等于 cache 数组的长度，则表示 cacheDrained
		if (cachePointer === cache.length) {
			cacheDrained = true;
		}
		// 如果 listPointer 等于 list 数组的长度，则表示 listDrained
		if (listPointer === list.length) {
			listDrained = true;
		}
		return cacheDrained || listDrained;
	}
	// 平行迁移
	function parallelMigrate() {
		// 两个数组中的元素做平行赋值
		cache[cachePointer] = list[listPointer];
		snapshot.push({ parallel: true, result: cache.slice(0) });
		// 双边指针 +1
		cachePointer += 1;
		listPointer += 1;
		// 检查循环是否结束
		loopOver = checkWhetherLoopOver();
	}
	// 从数组中，找到匹配项的 索引
	function findIndexOfSpecificItemFromArray(fromIndex, array, item) {
		// 用 for 循环，从 fromIndex 进行迭代，避免逻辑错误 和 不必要的遍历
		for (let i = fromIndex; i < array.length; i++) {
			if (compare(item, array[i])) {
				return i;
			}
		}
		return null;
	}
	// 在 cache 中插入新元素
	function insertNewElementIntoCache(index, item) {
		// 插入新增元素
		cache.splice(index, 0, item);
		// 加入快照
		snapshot.push({ parallel: false, result: cache.slice(0) });
		// 双边指针 +1
		cachePointer += 1;
		listPointer += 1;
		// 检查循环是否结束
		loopOver = checkWhetherLoopOver();
	}
	// 交换 cache 中，元素的位置
	function swapElementInCache(toBeSwapped, from, item) {
		// 检查被替换的元素是否存在于 list 的后续部分中
		const index = findIndexOfSpecificItemFromArray(listPointer + 1, list, cache[toBeSwapped]);
		// 如果 index !== null ，说明被替换的元素，仍旧在后续数组中
		// cache 中 toBeSwapped 元素，根据 index 的结果看，是换到 from 的位置，还是直接被splice掉
		cache.splice(from, 1, ...(index === null ? [] : [cache[toBeSwapped]]));
		// 将 list 中的新数据 swap 进 cache 中
		cache.splice(toBeSwapped, 1, item);
		// 加入快照
		snapshot.push({ parallel: false, result: cache.slice(0) });
		// 双边指针 +1
		cachePointer += 1;
		listPointer += 1;
		// 检查循环是否结束
		loopOver = checkWhetherLoopOver();
	}
	// 移除 cache 中剩余的元素，每次做一个镜像
	function* removeTheRestInCache() {
		// 从 cachePointer 开始，到 cache.length - 1为止，对剩余的 cache 元素进行迭代
		const counts = cache.length - cachePointer;
		for (let i = 0; i < counts; i++) {
			// 移除1条
			cache.splice(cachePointer, 1);
			// 加入快照
			snapshot.push({ parallel: false, result: cache.slice(0) });
			// 双边指针 +1
			// bug：在前一次的移除1条操作后，由于之前指针所指元素已经从cache中消失，
			// CachePointer实际上已经指向了下次需要移除的元素，cachePointer无需 +1 ，
			// 同时，此时 listPointer 已经指向了 list 数组中，最后一个元素之后，也无需 +1
			// cachePointer += 1;
			// listPointer += 1;
			yield { payload: { cachePointer, cache, listPointer, list } };
		}
		// 检查循环是否结束
		// bug：走到这一步的时候，loopOver已经为true，且后续不再检查loopOver的值，所以不用再做 checkWhetherLoopOver 检查
		// loopOver = checkWhetherLoopOver();
	}
	// 生成 target 和 reference 的浅拷贝
	// taget => cache
	// reference => list
	let cache = target.slice(0);
	let list = reference.slice(0);
	// snapshot 数组用来存放修改快照
	const snapshot = [];
	// cacheDrained 表示 cache 数组耗尽；listDrained 表示 list 数组耗尽
	let cacheDrained = false;
	let listDrained = false;

	// 建立 cache 的指针 和 list 的指针
	let cachePointer = 0;
	let listPointer = 0;

	// loopOver 用来表示迭代是否已经结束
	let loopOver = checkWhetherLoopOver();

	while (loopOver === false) {
		const itemInCacheForThisLoop = cache[cachePointer];
		const itemInListForThisLoop = list[listPointer];
		// 去 list 中，当前 listPointer 索引位置，进行比较
		if (compare(itemInCacheForThisLoop, itemInListForThisLoop)) {
			// 表明这是一个 parallel 操作，之后拿到快照以后，可以选择性地进行批量数据迁移
			parallelMigrate();
		} else {
			// 非平行操作开始
			// 反过来，拿 itemInListForThisLoop 在 cache 中，cachePointer 之后，查询是否有匹配项
			const indexFoundInCache = findIndexOfSpecificItemFromArray(cachePointer + 1, cache, itemInListForThisLoop);
			// 如果没有找到，说明 list 中的这个元素是新加的元素，
			// 所做的操作是，在 CachePointer 的位置，对此元素做 splice ，并且对 pointer 分别 +1
			if (indexFoundInCache === null) {
				insertNewElementIntoCache(cachePointer, itemInListForThisLoop);
			} else {
				// 此时，itemInList 在 cache 中的其它位置 —— indexFoundInCache 处，找到了元素，需要将元素进行换位
				swapElementInCache(cachePointer, indexFoundInCache, itemInListForThisLoop);
			}
		}
		yield { payload: { cachePointer, cache, listPointer, list } };
	}
	// 如果 list 干涸，cache 未干涸，则将 cache 中剩余的内容进行擦除
	if (listDrained === true && !cacheDrained) {
		yield* removeTheRestInCache();
	}
	// 如果 cache 干涸，list 未干涸，则将 list 中剩余的内容全部加入到 cache 中去
	while (cacheDrained === true && !listDrained) {
		// list.slice(listPointer).reduce((accumulator, currentElement) => {
		// 	accumulator.push(currentElement);
		// 	snapshot.push({ parallel: false, result: accumulator.slice(0) });
		// 	listPointer++;
		// 	return accumulator;
		// }, []);
		// 因为数组函数的限制，没法在 reduce 的 handler 中，使用 yield，所以，做一个改写
		cache.push(list[listPointer++]);
		cachePointer++;
		snapshot.push({ parallel: false, result: cache.slice(0) });
		loopOver = checkWhetherLoopOver();
		yield { payload: { cachePointer, cache, listPointer, list } };
	}
	return snapshot;
}

function simulateMethodsBinding(context, theFunctions) {
	const result = {};
	for (const key in theFunctions) {
		result[key] = theFunctions[key].bind(context);
	}
	return result;
}

export default {
	name: "TreeNode",
	props: {
		treeItem: {}
	},
	inheritAttrs: false,
	data() {
		return {
			downstreamSwitch: true,
			childrenCache: [],
			customData: { ...this.customData.generator() },
			customMethods: { ...simulateMethodsBinding(this, this.customMethods) },
			urgent: false,
			animationUrgent: false,
			snapshots: [],
			idleScheduler: Offloader.scheduleIdleTask(),
			ani: Offloader.scheduleAnimationTask(),
			openOrClose: false,
			nodeInstance: this,
			// 节点 nodeMain 的类
			nodeMainClass: "",
			unwatches: [],
			nodeClass: ""
		};
	},
	components: {
		TreeFlatList: () => import("./TreeFlatList.vue")
	},
	inject: {
		customListeners: {
			from: "customListenersFor" + componentName,
			default() {
				return [];
			}
		},
		customVBinding: {
			from: "customVBinding|" + componentName,
			default() {
				return function() {
					return {};
				};
			}
		},
		childrenKeys: {
			from: "childrenIdentifiers",
			default() {
				return ["children"];
			}
		},
		// 迁移步进，每次迁移多少个数据
		migrationStep: {
			default() {
				return "all";
			}
		},
		// 迁移间隔，每隔多少毫秒，迁移一次数据
		migrationInterval: {
			default() {
				return 0;
			}
		},
		customData: {
			from: "customDataFor" + componentName,
			default() {
				return {
					generator: function() {
						return {};
					}
				};
			}
		},
		customMethods: {
			from: "customMethodsFor" + componentName,
			default() {
				return {};
			}
		},
		watchBase: {
			from: "watchToBaseFor" + componentName,
			default() {
				return {};
			}
		},
		watchHandlers: {
			from: "watchToHandlersFor" + componentName,
			default() {
				return {};
			}
		},
		uniqueKey: {},
		parentList: {}
	},
	created() {
		const vm = this;

		const watchBaseKeys = Object.keys(this.watchBase);
		// 对注入的 handlers 的 keys 做迭代，对对应的内容做 watch 操作
		// 对 handlersKeys 再做一波基于 watchToId 的过滤
		const handlersKeys = Object.keys(vm.watchHandlers).filter(key => {
			return (
				// 如果传入的是 function 的话，就直接watch了、如果不是 function，又没有 id 的话，也可以watch、
				// 如果有 id ，且等于 watchToId 的话，也可以watch
				typeof vm.watchHandlers[key] === "function" ||
				vm.watchHandlers[key].id === undefined ||
				vm.watchHandlers[key].id === vm.watchToId
			);
		});
		const restHandlerKeys = handlersKeys.filter(handlerKey => {
			if (watchBaseKeys.includes(handlerKey)) {
				vm.unwatches.push(
					vm.$watch(
						`watchBase.` + handlerKey,
						vm[`watchHandlers`][handlerKey].handler || vm[`watchHandlers`][handlerKey],
						vm[`watchHandlers`][handlerKey].options || {}
					)
				);
				return;
			}
			return true;
		});
		// 为 watchToBase 中不存在的 属性 添加 watch 组件属性的 watcher
		restHandlerKeys.forEach(handlerKey => {
			vm.unwatches.push(
				vm.$watch(
					handlerKey,
					vm[`watchHandlers`][handlerKey].handler || vm[`watchHandlers`][handlerKey],
					vm[`watchHandlers`][handlerKey].options || {}
				)
			);
		});
	},
	computed: {
		listenersForVOn: function() {
			if (this.customListeners.length > 0) {
				const bindedListeners = this.customListeners.map(l => {
					return [l[0], l[1].bind(this)];
				});
				return Object.fromEntries(bindedListeners);
			} else {
				return {};
			}
		},
		listItems: function() {
			return this.downstreamSwitch ? this.childrenCache : [];
		},
		childrenInThisItem: function() {
			const vm = this;
			return vm.childrenKeys.map(key => vm.treeItem && vm.treeItem[key]).find(children => Array.isArray(children));
		},
		wholeNodeClass: function() {
			return this.$style.node + (this.nodeClass ? " " + this.nodeClass : "");
		}
	},
	methods: {
		unwatchAll: function() {
			this.unwatches.forEach(unwatch => unwatch());
			this.unwatches = [];
		},
		expandAndCollapse: function() {
			this.openOrClose = !this.openOrClose;
		},
		drawOff: function() {
			this.downstreamSwitch = true;
		},
		getSnapshotReady: function() {
			const vm = this;
			// 两个数组，最终目标数组同步成参照数组，形成 v-for 可用的快照序列
			const snapshotGen = getSnapshotWhenSyncingTwoArrays(this.childrenCache, this.childrenInThisItem, this.uniqueKey);
			vm.idleScheduler
				.assign(snapshotGen, 2000, vm, "urgent")
				.then(snapshots => {
					vm.snapshots = snapshots;
				})
				.catch(err => {
					throw err;
				});
		},
		manuallyWatchSnapshots: function() {
			const vm = this;
			// 1、迁移步进为： this.migrationStep
			// 2、迁移间隔为： this.migrationInterval
			// const step = this.migrationStep;
			// const interval = this.migrationInterval;
			// 不使用 promise，而是手动watch的方式，保证各种情况下，都可以在
			// 该方法调用后，根据最新的 snapshots ，去做数据迁移。
			this.$watch("snapshots", function(snapshots) {
				// 获取 snapshots 后，对其进行查看。
				// 整个 snapshots 是一个大数组，然后里面的每个元素，都有 parallel 这个属性。
				// 默认情况下，跳过 parallel 的元素，仅拿出 result 进行赋值。
				// 这里的每次赋值，都需要放进 generator 中，在每次 requestAnimationFrame 的时候，去调用
				const migratorGen = migrator(vm.migrationStep, snapshots, vm);
				vm.ani.assign(migratorGen, 0);
			});
		}
	},
	watch: {
		childrenInThisItem: {
			handler: function(nv) {
				const vm = this;
				nv &&
					nv.forEach(item => {
						vm.parentList[item.id] = vm.treeItem;
					});
				this.getSnapshotReady(nv);
			},
			immediate: true
		}
	},
	mounted() {
		const vm = this;
		setTimeout(() => {
			vm.manuallyWatchSnapshots();
		});
	},
	destroyed() {
		this.unwatchAll();
	}
};
</script>

<style module>
.node {
	display: flex;
	align-items: flex-start;
}
.node > .leftSlot {
	padding: var(--tree-node-left-padding, var(--tree-node-padding-default));
}
.node > .nodeMain > .nodeContent {
	padding: var(--tree-node-content-padding, var(--tree-node-padding-default));
}
.nodeContent {
	height: var(--tree-node-height, fit-content);
}
.nodeMain {
	flex-grow: 1;
	margin: var(--tree-node-content-margin, 0 0 0 8px);
}
.nodeMain:hover {
	background: var(--tree-node-main-hover-background);
}
</style>
