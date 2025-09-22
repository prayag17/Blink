import { IconButton } from "@mui/material";
import React from "react";

interface PictureInPictureButtonProps {
	onTogglePiP: () => void;
	isPiPActive: boolean;
}

const PictureInPictureButton = ({ onTogglePiP, isPiPActive }: PictureInPictureButtonProps) => {
	// Check if PiP is supported by the browser
	const isPiPSupported = typeof document !== 'undefined' && 
		'pictureInPictureEnabled' in document && 
		document.pictureInPictureEnabled;

	// Don't render the button if PiP is not supported
	if (!isPiPSupported) {
		return null;
	}

	return (
		<IconButton 
			onClick={onTogglePiP} 
			title={isPiPActive ? "Exit Picture-in-Picture" : "Enter Picture-in-Picture"}
		>
			<span className="material-symbols-rounded fill">
				{isPiPActive ? "picture_in_picture_alt" : "picture_in_picture"}
			</span>
		</IconButton>
	);
};

export default PictureInPictureButton;