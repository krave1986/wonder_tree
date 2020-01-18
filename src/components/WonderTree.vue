<template>
	<div :class="containerClasses" :style="containerStyle" style="overflow-x: hidden; padding: var(--tree-padding, 0 0 0 8px)">
		<tree-flat-list :isTopList="true" :listItems="treeData" v-model="expand">
			<template v-for="slotName in Object.keys($scopedSlots)" #[slotName]="scope">
				<slot :name="slotName" v-bind="scope"></slot>
			</template>
		</tree-flat-list>
	</div>
</template>

<script>
import TreeFlatList from "./TreeFlatList";

export default {
	name: "WonderTree",
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
			type: [String, Array]
		},
		expandTopList: {
			default: true
		}
	},
	components: {
		TreeFlatList
	},
	data() {
		return {
			bufferedData: [],
			expand: this.expandTopList
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
		const providePayload = {
			watchToId: this.watchToId,
			uniqueKey: this.uniqueKey,
			migrationInterval: this.migrationInterval,
			parentList: {}
		};
		if (this.migrationStep) {
			providePayload.migrationStep = this.migrationStep;
		}
		if (this.childrenIdentifiers) {
			providePayload.childrenIdentifiers =
				typeof this.childrenIdentifiers === "string" ? [this.childrenIdentifiers] : this.childrenIdentifiers;
		}
		return providePayload;
	}
};
</script>

<style module>
.treeContainer {
	overflow: auto;
	--tree-node-padding-default: var(--tree-node-padding, 7px 0);
}
.treeContainer > * {
	width: inherit;
}
.treeContainer:hover {
	/* 鼠标hover到treeContainer后，做好滚动的准备 */
	will-change: scroll-position;
}
</style>
