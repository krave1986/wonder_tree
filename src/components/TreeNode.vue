<template>
	<div>
		{{ treeItem.label }}
	</div>
</template>

<script>
const componentName = "TreeNode";

function eliminateDuplicationsInRestOfCache(migrationUnit, index, cache, key) {
	// cache 剩余的，需要做去重校验的部分
	const restSegmentInCache = cache.slice(index);
	return migrationUnit.reduce((accumulator, elementInMigrationUnit) => {
		return accumulator.filter(e => {
			return e[key] !== elementInMigrationUnit[key];
		});
	}, restSegmentInCache);
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
		debugger;
	}
}

export default {
	props: {
		treeItem: {}
	},
	data() {
		return {
			downstreamSwitch: false,
			childrenCache: [],
			customDataAbc: { ...this.customData.generator() }
		};
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
		migrationStepInAction: function() {
			return this.migrationStep === "all" ? this.childrenInThisItem.length : this.migrationStep;
		},
		childrenInThisItem: function() {
			const vm = this;
			return vm.childrenKeys.map(key => vm.treeItem && vm.treeItem[key]).find(children => Array.isArray(children));
		}
	},
	methods: {
		migrateData: function() {
			const vm = this;
			// 1、迁移步进为： this.migrationStepInAction
			// 2、迁移间隔为： this.migrationInterval
			const step = this.migrationStepInAction;
			const interval = this.migrationInterval;
			// 3、生成 generator 对象，在每次间隔到点时，调用 generator 。
			// over 表示迭代是否已经结束
			let over = false;
			const gen = migrator(step, this.childrenInThisItem, this.childrenCache, this.uniqueKey);
			// 这里，我想根据 migrator 的迭代结果，进行一定的定制化操作
			// 比如，迭代到某个索引长度，就不再进行数据迭代，下方显示 ... 等等
			function timeController(gen, interval, nextPointer, customizedMigrationHandler) {
				// 触发 generator ，然后根据 generator 的返回值，去调用自定义 handler 。
				const genResult = gen.next(nextPointer);
				// 拿到下次 generator 触发时的 pointer 位置，进行一个自定义的逻辑操作。
				if (genResult.done === false) {
					const { gen, interval, nextPointer, customizedMigrationHandler } = customizedMigrationHandler();
				}

				debugger;
			}
		}
	},
	mounted() {
		this.migrateData();
		// debugger;
	}
};
</script>