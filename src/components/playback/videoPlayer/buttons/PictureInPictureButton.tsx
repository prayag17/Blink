import { IconButton } from "@mui/material";
import React, { useCallback } from "react";
import { useShallow } from "zustand/shallow";
import { togglePictureInPicture } from "@/utils/methods/pictureInPicture";
import { usePlaybackStore } from "@/utils/store/playback";

const PictureInPictureButton = () => {
	const { 
		isPictureInPicture, 
		isPictureInPictureSupported, 
		setPictureInPicture
	} = usePlaybackStore(
		useShallow((state) => ({
			isPictureInPicture: state.playerState.isPictureInPicture,
			isPictureInPictureSupported: state.playerState.isPictureInPictureSupported,
			setPictureInPicture: state.setPictureInPicture,
		})),
	);

	const handleTogglePiP = useCallback(async () => {
		try {
			// Get the video element from ReactPlayer
			// We'll need to access this through the player ref
			// For now, let's try to get it from the DOM
			const videoElement = document.querySelector('video') as HTMLVideoElement;
			
			if (!videoElement) {
				console.error("Video element not found");
				return;
			}

			const enteredPiP = await togglePictureInPicture(videoElement);
			setPictureInPicture(enteredPiP);
		} catch (error) {
			console.error("Failed to toggle Picture-in-Picture:", error);
		}
	}, [setPictureInPicture]);

	// Don't render the button if PiP is not supported
	if (!isPictureInPictureSupported) {
		return null;
	}

	return (
		<IconButton onClick={handleTogglePiP} title={isPictureInPicture ? "Exit Picture-in-Picture" : "Enter Picture-in-Picture"}>
			<span className="material-symbols-rounded fill">
				{isPictureInPicture ? "picture_in_picture_alt" : "picture_in_picture"}
			</span>
		</IconButton>
	);
};

export default PictureInPictureButton;