// import Assigner from "./Assigner";

export default class OffloadWorker {
	constructor() {}
	static scheduleIdleTask() {
		console.log("Idle!");
	}
	static scheduleAnimationTask() {
		console.log("Animation!");
	}
}
