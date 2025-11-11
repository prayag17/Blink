import { AnimatePresence, motion } from "motion/react";
import React from "react";
import { useShallow } from "zustand/shallow";
import { useBackdropStore } from "@/utils/store/backdrop";
import BlurhashCanvas from "../blurhash-canvas";

export default function Backdrop() {
	// const [backdropLoading, setBackdropLoading] = useState(true);

	const { backdropHash } = useBackdropStore(
		useShallow((state) => ({
			backdropHash: state.backdropHash,
		})),
	);

	if (!backdropHash) {
		return null;
	}

	return (
		<AnimatePresence mode="sync">
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				key={backdropHash}
				exit={{ opacity: 0 }}
				transition={{
					duration: 2,
					ease: "easeInOut",
				}}
				className="app-backdrop-container"
			>
				<BlurhashCanvas
					blurhashString={backdropHash}
					width={300}
					height={150}
					canvasProps={{
						style: {
							display: "block",
							width: "100vw",
							height: "100vh",
							margin: "0 auto",
							filter: "brightness(0.8) contrast(1.6) saturate(1.6)",
						},
					}}
				/>
			</motion.div>
		</AnimatePresence>
	);
}