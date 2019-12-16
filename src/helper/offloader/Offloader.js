// import Assigner from "./Assigner";
import IdleAssigner from "./IdleAssigner";
import AnimationAssigner from "./AnimationAssigner";

export default class OffloadWorker {
	constructor() {}
	static scheduleIdleTask() {
		return new IdleAssigner();
	}
	static scheduleAnimationTask() {
		return new AnimationAssigner();
	}
}
