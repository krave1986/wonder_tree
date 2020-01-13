<template>
	<div id="app">
		<WonderTree
			:migrationStep="1"
			:migrationInterval="500.0"
			:treeData="treeData"
			:watchToId="'1'"
			:childrenIdentifiers="['ruleSets', 'rules']"
			:style="'width:400px; height: 600px'"
		>
			<template v-slot:left="nodeInstance">
				<div>{{ nodeInstance.treeItem.id }}</div>
			</template>
		</WonderTree>
	</div>
</template>
<script>
import WonderTree from "./components/WonderTree";
import axios from "axios";
import Vue from "vue";
export default {
	name: "app",
	components: {
		WonderTree
	},
	data() {
		return {
			treeData: [],
			watchToBaseForTreeFlatList: {
				expand: Math.random()
			},
			watchToHandlersForTreeFlatList: {
				expand: {
					id: "1",
					handler: function(nv, ov) {
						this.openOrClose = !this.openOrClose;
					},
					options: {
						deep: true
					}
				}
			}
		};
	},
	mounted() {
		axios("/baohanwangguan.json").then(({ data }) => {
			this.treeData = data;
		});
	},
	methods: {
		newRandom: function() {
			this.watchToBaseForTreeFlatList.expand = Math.random();
		}
	},
	provide() {
		const vm = this;
		return {
			watchToBaseForTreeFlatList: vm.watchToBaseForTreeFlatList,
			watchToHandlersForTreeFlatList: vm.watchToHandlersForTreeFlatList,
			afterMountedForTreeFlatList: function() {},
			beforeMountedForTreeFlatList: function() {
				if (this.$attrs.parentNode === undefined) {
					this.openOrClose = true;
				}
			},
			customDataForTreeNode: {
				generator() {
					return {
						abc: true
					};
				}
			},
			treeFlatListComponent: "div",
			customizedListeners: [
				{
					event: "triad-select",
					forComponent: "TreeFlatList",
					handler: function() {
						console.log(1, this);
					},
					successive: true
				},
				{
					event: "triad-select",
					forComponent: "TreeNode",
					handler: function() {
						console.log(1, this);
					},
					successive: false
				}
			]
		};
	}
};
</script>

<style>
* {
	line-height: 1em;
}
body {
	margin: 0;
	--tree-node-height: 1rem;
}
#app {
	--tree-flat-list-vertical-transition: height 800ms ease-out;
}
svg {
	display: block;
}
</style>
<style type="text/css">
.icon {
	width: 1em;
	height: 1em;
	vertical-align: -0.15em;
	fill: currentColor;
	overflow: hidden;
}
</style>
