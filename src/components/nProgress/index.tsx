import { LinearProgress } from "@mui/material";
import { useNProgress } from "@tanem/react-nprogress";
import type React from "react";

const NProgress: React.FC<{ isAnimating: boolean | number }> = ({
	isAnimating,
}) => {
	const { animationDuration, isFinished, progress } = useNProgress({
		isAnimating,
	});

	return (
		<div
			style={{
				opacity: isFinished ? 0 : 1,
				pointerEvents: "none",
				transition: `opacity ${animationDuration}ms linear`,
				position: "fixed",
				top: "0",
				left: "0",
				right: "0",
				zIndex: "10001",
			}}
		>
			<LinearProgress
				sx={{
					height: 3,
					transitionDuration: animationDuration,
				}}
				value={progress * 100}
				variant="determinate"
			/>
		</div>
	);
};

export default NProgress;
