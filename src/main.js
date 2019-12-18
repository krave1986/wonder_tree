import Vue from "vue";
import App from "./App.vue";

import "./directives/index";

import "./assets/iconfont/iconfont";

Vue.config.productionTip = false;

new Vue({
	render: h => h(App)
}).$mount("#app");
