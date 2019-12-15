// import Assigner from "./Assigner";
import IdleAssigner from "./IdleAssigner";

export default class OffloadWorker {
	constructor() {}
	static scheduleIdleTask() {
		return new IdleAssigner();
	}
	static scheduleAnimationTask() {
		console.log("Animation!");
	}
}
