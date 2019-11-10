<template>
	<div :class="containerClasses" :style="containerStyle" style="width:400px; height: 600px">
		<!-- <tree-flat-list :listItems="treeData" /> -->
	</div>
</template>

<script>
// import TreeFlatList from "./TreeFlatList";

export default {
	name: "TheTree",
	inheritAttrs: false,
	props: {
		sizeContainment: {
			type: Boolean,
			default: true
		},
		treeData: {},
		watchToId: {},
		uniqueKey: {
			type: String,
			default: "id"
		},
		childrenIdentifiers: {
			type: [String, Array],
			required: true
		}
	},
	components: {
		// TreeFlatList
	},
	data() {
		return {
			bufferedData: []
		};
	},
	computed: {
		containerClasses: function() {
			return [this.$style.treeContainer];
		},
		containmentValue: function() {
			return "style layout paint" + (this.sizeContainment ? " size" : "");
		},
		containerStyle: function() {
			return { contain: this.containmentValue };
		}
	},
	provide() {
		return {
			watchToId: this.watchToId,
			uniqueKey: this.uniqueKey,
			childrenIdentifiers:
				typeof this.childrenIdentifiers === "string"
					? [this.childrenIdentifiers]
					: this.childrenIdentifiers
		};
	}
};
</script>

<style module>
.treeContainer {
	background-color: darkkhaki;
	overflow: auto;
}
.treeContainer:hover {
	/* 鼠标hover到treeContainer后，做好滚动的准备 */
	will-change: scroll-position;
}
</style>
