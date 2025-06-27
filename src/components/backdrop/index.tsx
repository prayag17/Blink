import { AnimatePresence, motion } from "motion/react";
import React, { useLayoutEffect, useState } from "react";
import { useBackdropStore } from "@/utils/store/backdrop";

export default function Backdrop() {
	const [backdropLoading, setBackdropLoading] = useState(true);
	
	const [backdropId, backdropUrl] = useBackdropStore((state) => [
		state.backdropId,
		state.backdropUrl,
	]);
	
	// Reset loading status for backdrop
	useLayoutEffect(() => {
		setBackdropLoading(true);
	}, [backdropId]);
	
	if (!backdropUrl) {
		return null;
	}
	
	return (
		<div className="app-backdrop-container">
			<AnimatePresence>
				<motion.img
					key={backdropId}
					src={backdropUrl}
					alt=""
					className="app-backdrop"
					initial={{
						opacity: 0,
					}}
					animate={{
						opacity: backdropLoading ? 0 : 1,
					}}
					exit={{
						opacity: 0,
					}}
					transition={{
						opacity: {
							duration: 1.2,
						},
					}}
					onLoad={() => setBackdropLoading(false)}
					loading="lazy"
				/>
			</AnimatePresence>
		</div>
	);
}