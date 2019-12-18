<template>
	<div id="app" @click="newRandom">
		<TheTree
			:migrationStep="1"
			:migrationInterval="500.0"
			:treeData="treeData"
			:watchToId="'1'"
			:childrenIdentifiers="['ruleSets', 'rules']"
			:style="'width:400px; height: 600px'"
		></TheTree>
	</div>
</template>
<script>
import TheTree from "./components/TheTree";
import axios from "axios";
import Vue from "vue";
export default {
	name: "app",
	components: {
		TheTree
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
						// immediate: true,
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
			// afterMountedForTreeFlatList: function() {}
			beforeMountedForTreeFlatList: function() {
				this.openOrClose = true;
			},
			customDataForTreeNode: {
				generator() {
					return {
						abc: true
					};
				}
			}
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
	--tree-flat-list-vertical-transition: height 1s ease-out;
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
