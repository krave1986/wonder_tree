import IdleAssigner from "./IdleAssigner";
import AnimationFrameAssigner from "./AnimationFrameAssigner";

export default class OffloadWorker {
	constructor() {}
	static scheduleIdleTask() {
		return new IdleAssigner();
	}
	static scheduleAnimationTask() {
		return new AnimationFrameAssigner();
	}
}
