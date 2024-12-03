import { LinearProgress } from "@mui/material";
import { useNProgress } from "@tanem/react-nprogress";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import React, { useMemo } from "react";
import { createPortal } from "react-dom";

export default function NProgress() {
	const isQueryFetching = useIsFetching();
	const isMutating = useIsMutating();
	const routeIsLoading = useRouterState().isLoading;

	const isAnimating = useMemo(() => {
		if (isQueryFetching || isMutating || routeIsLoading) {
			return true;
		}
		return false;
	}, [isQueryFetching, isMutating, routeIsLoading]);

	const { animationDuration, isFinished, progress } = useNProgress({
		isAnimating,
	});

	return createPortal(
		<div
			style={{
				pointerEvents: "none",
				transition: "opacity 250ms linear",
				position: "fixed",
				top: "0",
				left: "0",
				right: "0",
				zIndex: "10001",
				opacity: isFinished ? 0 : 1,
			}}
		>
			{isAnimating && (
				<LinearProgress
					sx={{
						height: 3,
						transitionDuration: animationDuration,
					}}
					value={progress * 100}
					variant="determinate"
				/>
			)}
		</div>,
		document.body,
	);
};

