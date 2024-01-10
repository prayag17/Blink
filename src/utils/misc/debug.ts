function getVideoDebugInfo(videoElement: HTMLVideoElement) {
	const quality = videoElement.getVideoPlaybackQuality();

	const debugInfo = {
		droppedFrames: quality.droppedVideoFrames,
		totalFrames: quality.totalVideoFrames,
		resolution: {
			width: videoElement.videoWidth,
			height: videoElement.videoHeight,
		},
		container:
			videoElement.currentSrc.split(".").pop()?.split("?").pop() || "unknown",
		duration: videoElement.duration,
		currentTime: videoElement.currentTime,
		playbackRate: videoElement.playbackRate,
		volume: videoElement.volume,
		currentQuality: {
			width: videoElement.videoWidth,
			height: videoElement.videoHeight,
		},
	};

	return debugInfo;
}
