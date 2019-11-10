<template>
	<the-tree :childrenIdentifiers="['ruleSets', 'rules']" id="app">bbbbb</the-tree>
</template>

<script>
import axios from "axios";
import TheTree from "./components/TheTree";

export default {
	name: "app",
	data() {
		return {
			treeData: []
		};
	},
	components: {
		TheTree
	},
	mounted() {
		axios("/baohanwangguan.json").then(res => {
			this.treeData = res.data;
		});
	}
};
</script>

<style>
body {
	margin: 0;
}
</style>
