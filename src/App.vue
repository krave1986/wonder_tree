<template>
	<div id="app" @click="newRandom">
		<TheTree
			:migrationStep="1"
			:migrationInterval="500.0"
			:treeData="treeData"
			:watchToId="'1'"
			:childrenIdentifiers="['ruleSets', 'rules']"
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
		axios("/baohanwangguan1.json").then(({ data }) => {
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
body {
	margin: 0;
}
#app {
	--tree-flat-list-vertical-transition: height 1s ease-in;
}
</style>
