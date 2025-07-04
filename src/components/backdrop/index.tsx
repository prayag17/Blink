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
		<div className="app-backdrop-container">
			<BlurhashCanvas
				key={backdropHash}
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
		</div>
	);
}