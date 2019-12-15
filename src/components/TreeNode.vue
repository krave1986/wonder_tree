<template>
	<div @click.stop="drawOff">
		{{ treeItem.label }}
		<tree-flat-list :listItems="listItems" />
	</div>
</template>

<script>
import IdleAssigner from "../helper/offloader/IdleAssigner";
import Assigner from "../helper/offloader/Assigner";
import Offloader from "../helper/offloader/Offloader";

const componentName = "TreeNode";
let snapshotTestament = 1;

function eliminateDuplicationsInRestOfCache(migrationUnit, index, cache, key) {
	// cache 剩余的，需要做去重校验的部分
	const restSegmentInCache = cache.slice(index);
	return migrationUnit.reduce((accumulator, elementInMigrationUnit) => {
		return accumulator.filter(e => {
			return e[key] !== elementInMigrationUnit[key];
		});
	}, restSegmentInCache);
}

function getPropertyFromString(obj, keyToken) {
	const keyArr = keyToken.split(".");
	return keyArr.reduce((subLevelProperty, key) => {
		try {
			return subLevelProperty[key];
		} catch (error) {
			return undefined;
		}
	}, obj);
}

function* migrator(step, base, cache, uniqueKey) {
	console.log(cache);
	// migrationUnitEndBefore 用来存放本次迭代单元中，末位元素的索引之后的索引
	let migrationUnitEndBefore;
	let pointer = 0;
	let touchTheBottom = false;
	while (!touchTheBottom) {
		// 1、确定这次迭代的 数据迁移单元
		const migrationUnit = base.slice(pointer, (migrationUnitEndBefore = pointer + step));
		// 判断 migrationUnit 的长度，如果 migrationUnit 的长度为 0 ，则说明已经没有数据可以做迁移了。
		// 没有数据可以做迁移的话，自然就结束 generator 了。直接 return 。
		if (migrationUnit.length === 0) {
			return;
		}
		// 2、判断 pointer 是否已经超出 cache 的长度，用来控制之后是不是要继续执行 while 循环
		touchTheBottom = migrationUnitEndBefore >= base.length;
		// 3、判断 migrationUnitEndBefore 有没有超出 cache 的长度，超过的话，就不用再做验重校验了；
		if (migrationUnitEndBefore < cache.length) {
			// 没有达到的时候，才进行验重操作
			// noDuplicationsInRest 用于存放最终没有重复内容的剩余部分
			let noDuplicationsInRest;
			// 向后验重。此时 migrationUnitEndBefore 已经指向了验重的起始位置
			// 对 迁移单元 进行迭代，使用 reduce 方法，在迭代迁移单元的过程当中，就把之后要替换掉的数组内容做好。
			noDuplicationsInRest = eliminateDuplicationsInRestOfCache(migrationUnit, migrationUnitEndBefore, cache, uniqueKey);
			// 把 迁移单元 和 noDuplicationsInRest 进行合并，从 migrationUnitEndBefore 这个索引开始，全部 splice 掉
			cache.splice(pointer, Infinity, ...migrationUnit.concat(noDuplicationsInRest));
			//
		} else {
			// migrationUnitEndBefore 已经超出 cache 的长度，直接基于 pointer 做 splice 操作
			cache.splice(pointer, 0, ...migrationUnit);
		}
		var abc = yield migrationUnitEndBefore;
	}
}

function* getSnapshotWhenSyncingTwoArrays(target, reference, uniqueKey) {
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
		checkWhetherLoopOver();
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
		checkWhetherLoopOver();
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
		checkWhetherLoopOver();
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
			cachePointer += 1;
			listPointer += 1;
			yield { payload: { cachePointer, cache, listPointer, list } };
		}
		// 检查循环是否结束
		checkWhetherLoopOver();
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
		checkWhetherLoopOver();
		yield { payload: { cachePointer, cache, listPointer, list } };
	}
	return snapshot;
}

export default {
	name: "TreeNode",
	props: {
		treeItem: {}
	},
	data() {
		return {
			downstreamSwitch: false,
			childrenCache: [],
			customDataAbc: { ...this.customData.generator() },
			urgent: false,
			snapshots: [],
			a: new Assigner(),
			idaaaa: Offloader.scheduleIdleTask()
		};
	},
	components: {
		TreeFlatList: () => import("./TreeFlatList.vue")
	},
	created() {
		const vm = this;
	},
	inject: {
		childrenKeys: "childrenIdentifiers",
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
		uniqueKey: {},
		customizedMigrationHandler: {
			default() {
				return function() {};
			}
		}
	},
	computed: {
		listItems: function() {
			return this.downstreamSwitch ? this.childrenCache : [];
		},
		childrenInThisItem: function() {
			const vm = this;
			return vm.childrenKeys.map(key => vm.treeItem && vm.treeItem[key]).find(children => Array.isArray(children));
		}
	},
	methods: {
		drawOff: function() {
			this.downstreamSwitch = true;
		},
		getSnapshotReady: function(nv) {
			const vm = this;
			snapshotTestament = nv.slice(0);
			// 两个数组，最终目标数组同步成参照数组，形成 v-for 可用的快照序列
			const snapshotGen = getSnapshotWhenSyncingTwoArrays(
				this.childrenCache,
				this.childrenInThisItem,
				this.uniqueKey
				// this.childrenInThisItem
				// snapshotTestament
			);
			// 声明 requestIdleCallback 需要调用的方法
			function pastime(gen, timeout, backpacker, bag) {
				// 我希望：尽量利用 requestIdleCallback 来运行 gen ，
				// 并在 timeout 达到之前，尽可能完成整个 gen 的运行。
				// 声明 idleHandler 让 requestIdleCallback 进行调用
				// 用 yieldResult 存放每次 gen.next() 的结果，包括 gen 的返回值：最后一次next()的结果
				let yieldResult;
				return new Promise(function(resolve, reject) {
					function idleHandler(deadline) {
						const genStart = Date.now();
						// 只要 gen 没有 done，timeRemaining 还有时间，didTimeout 没到，就持续执行循环语句
						while (
							(yieldResult = gen.next()).done === false &&
							(deadline.timeRemaining() > 3 || deadline.didTimeout)
						) {
							if (yieldResult.value.testament !== snapshotTestament) {
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
				});
			}
			pastime(snapshotGen, 2000, vm, "urgent")
				.then(result => {
					requestIdleCallback(() => {
						vm.snapshots = result;
					});
				})
				.catch(rejectReasons => {
					console.log(rejectReasons);
				});
		},
		manuallyWatchSnapshots: function() {
			const vm = this;
			// 1、迁移步进为： this.migrationStep
			// 2、迁移间隔为： this.migrationInterval
			const step = this.migrationStep;
			const interval = this.migrationInterval;
			// 不使用 promise，而是手动watch的方式，保证各种情况下，都可以在
			// 该方法调用后，根据最新的 snapshots ，去做数据迁移。
			this.$watch("snapshots", function(snapshots) {
				// 获取 snapshots 后，对其进行查看。
				// 整个 snapshots 是一个大数组，然后里面的每个元素，都有 parallel 这个属性。
				// 默认情况下，跳过 parallel 的元素，仅拿出 result 进行赋值。
				// 这里的每次赋值，都需要放进 generator 中，在每次 requestAnimationFrame 的时候，去调用
				vm.childrenCache = snapshots[snapshots.length - 1].result;
			});
		}
	},
	watch: {
		childrenInThisItem: {
			handler: function(nv) {
				// this.getSnapshotReady(nv);
			},
			immediate: true
		}
	},
	mounted() {
		const vm = this;
		setTimeout(() => {
			vm.manuallyWatchSnapshots();
		});
		// 两个数组，最终目标数组同步成参照数组，形成 v-for 可用的快照序列
		const snapshotGen = getSnapshotWhenSyncingTwoArrays(this.childrenCache, this.childrenInThisItem, this.uniqueKey);
		vm.idaaaa
			.assign(snapshotGen, 2000, vm, "urgent")
			.then(res => {
				console.log(res, "111111");
			})
			.catch(err => {
				console.log(err);
			});
		setTimeout(() => {
			vm.idaaaa.streamlineSymbol = Symbol();
		}, 55);
	}
};
</script>
