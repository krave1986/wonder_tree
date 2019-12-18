<template>
	<div :class="containerClasses" :style="containerStyle" style="overflow-x: hidden; padding: var(--tree-padding, 0 0 0 8px)">
		<tree-flat-list :listItems="treeData" />
	</div>
</template>

<script>
import TreeFlatList from "./TreeFlatList";

export default {
	name: "TheTree",
	inheritAttrs: false,
	props: {
		sizeContainment: {
			type: Boolean,
			default: true
		},
		migrationStep: {
			type: [Number, String],
			validator: function(value) {
				if (typeof value === "string") {
					return value === "all";
				} else {
					return Math.trunc(value) === value;
				}
			}
		},
		migrationInterval: {
			type: Number,
			validator: function(value) {
				return Math.trunc(value) === value;
			}
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
		TreeFlatList
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
				typeof this.childrenIdentifiers === "string" ? [this.childrenIdentifiers] : this.childrenIdentifiers,
			migrationStep: this.migrationStep,
			migrationInterval: this.migrationInterval
		};
	}
};
</script>

<style module>
.treeContainer {
	background-color: darkkhaki;
	overflow: auto;
}
.treeContainer > * {
	width: inherit;
}
.treeContainer:hover {
	/* 鼠标hover到treeContainer后，做好滚动的准备 */
	will-change: scroll-position;
}
</style>
