/**
 * Picture-in-Picture utility functions
 * Provides methods to check browser support and manage PiP mode
 */

/**
 * Checks if Picture-in-Picture is supported by the browser
 * @returns {boolean} True if PiP is supported, false otherwise
 */
export function isPictureInPictureSupported(): boolean {
	return (
		"pictureInPictureEnabled" in document &&
		document.pictureInPictureEnabled &&
		typeof HTMLVideoElement !== "undefined" &&
		"requestPictureInPicture" in HTMLVideoElement.prototype
	);
}

/**
 * Checks if a video element is currently in Picture-in-Picture mode
 * @param {HTMLVideoElement} videoElement - The video element to check
 * @returns {boolean} True if the video is in PiP mode, false otherwise
 */
export function isVideoInPictureInPicture(videoElement: HTMLVideoElement): boolean {
	return document.pictureInPictureElement === videoElement;
}

/**
 * Enters Picture-in-Picture mode for a video element
 * @param {HTMLVideoElement} videoElement - The video element to enter PiP mode
 * @returns {Promise<PictureInPictureWindow>} Promise that resolves to the PiP window
 * @throws {Error} If PiP is not supported or fails to enter PiP mode
 */
export async function enterPictureInPicture(
	videoElement: HTMLVideoElement,
): Promise<PictureInPictureWindow> {
	if (!isPictureInPictureSupported()) {
		throw new Error("Picture-in-Picture is not supported by this browser");
	}

	if (isVideoInPictureInPicture(videoElement)) {
		throw new Error("Video is already in Picture-in-Picture mode");
	}

	try {
		const pipWindow = await videoElement.requestPictureInPicture();
		return pipWindow;
	} catch (error) {
		console.error("Failed to enter Picture-in-Picture mode:", error);
		throw error;
	}
}

/**
 * Exits Picture-in-Picture mode
 * @returns {Promise<void>} Promise that resolves when PiP mode is exited
 * @throws {Error} If not currently in PiP mode or fails to exit PiP mode
 */
export async function exitPictureInPicture(): Promise<void> {
	if (!document.pictureInPictureElement) {
		throw new Error("No video is currently in Picture-in-Picture mode");
	}

	try {
		await document.exitPictureInPicture();
	} catch (error) {
		console.error("Failed to exit Picture-in-Picture mode:", error);
		throw error;
	}
}

/**
 * Toggles Picture-in-Picture mode for a video element
 * @param {HTMLVideoElement} videoElement - The video element to toggle PiP mode
 * @returns {Promise<boolean>} Promise that resolves to true if entered PiP, false if exited PiP
 * @throws {Error} If PiP is not supported or fails to toggle PiP mode
 */
export async function togglePictureInPicture(
	videoElement: HTMLVideoElement,
): Promise<boolean> {
	if (!isPictureInPictureSupported()) {
		throw new Error("Picture-in-Picture is not supported by this browser");
	}

	try {
		if (isVideoInPictureInPicture(videoElement)) {
			await exitPictureInPicture();
			return false; // Exited PiP
		}
		
		await enterPictureInPicture(videoElement);
		return true; // Entered PiP
	} catch (error) {
		console.error("Failed to toggle Picture-in-Picture mode:", error);
		throw error;
	}
}

/**
 * Gets the HTMLVideoElement from a ReactPlayer instance
 * @param {any} reactPlayerRef - The ReactPlayer ref object
 * @returns {HTMLVideoElement | null} The video element or null if not found
 */
export function getVideoElementFromReactPlayer(
	reactPlayerRef: any,
): HTMLVideoElement | null {
	if (!reactPlayerRef?.current) {
		return null;
	}

	// ReactPlayer provides access to the underlying video element
	// through the getInternalPlayer method
	try {
		const internalPlayer = reactPlayerRef.current.getInternalPlayer();
		
		// For HTML5 video, the internal player IS the video element
		if (internalPlayer instanceof HTMLVideoElement) {
			return internalPlayer;
		}

		// For some ReactPlayer configurations, we might need to dig deeper
		// Try to find the video element in the player's container
		const playerElement = reactPlayerRef.current.wrapper?.querySelector('video');
		if (playerElement instanceof HTMLVideoElement) {
			return playerElement;
		}

		return null;
	} catch (error) {
		console.error("Failed to get video element from ReactPlayer:", error);
		return null;
	}
}

/**
 * Adds Picture-in-Picture event listeners to a video element
 * @param {HTMLVideoElement} videoElement - The video element to add listeners to
 * @param {Object} callbacks - Object containing callback functions
 * @param {() => void} callbacks.onEnterPiP - Callback when entering PiP mode
 * @param {() => void} callbacks.onLeavePiP - Callback when leaving PiP mode
 * @returns {() => void} Function to remove the event listeners
 */
export function addPictureInPictureEventListeners(
	videoElement: HTMLVideoElement,
	callbacks: {
		onEnterPiP?: () => void;
		onLeavePiP?: () => void;
	},
): () => void {
	const handleEnterPiP = () => {
		console.log("Entered Picture-in-Picture mode");
		callbacks.onEnterPiP?.();
	};

	const handleLeavePiP = () => {
		console.log("Left Picture-in-Picture mode");
		callbacks.onLeavePiP?.();
	};

	videoElement.addEventListener("enterpictureinpicture", handleEnterPiP);
	videoElement.addEventListener("leavepictureinpicture", handleLeavePiP);

	// Return cleanup function
	return () => {
		videoElement.removeEventListener("enterpictureinpicture", handleEnterPiP);
		videoElement.removeEventListener("leavepictureinpicture", handleLeavePiP);
	};
}