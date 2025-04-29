// Write a react component that included an MUI circluar progress element utilizing NProgrss

import { CircularProgress } from "@mui/material";
import { useNProgress } from "@tanem/react-nprogress";
import React from "react";

const CircularPageLoadingAnimation = () => {
	const { progress } = useNProgress({
		isAnimating: true,
	});

	return (
		<div
			style={{
				pointerEvents: "none",
				position: "absolute",
				top: "50%",
				left: "50%",
				transform: "translate(-50%, -50%)",
				zIndex: "10001",
			}}
		>
			<CircularProgress
				// variant="indeterminate"
				sx={{
					transitionDuration: "0.3s",
					transform: `scale(${progress})`,
				}}
			/>
		</div>
	);
};

export default CircularPageLoadingAnimation;
