import * as blurhash from "blurhash-wasm";
import React, { useEffect } from "react";

type BlurhashCanvasProps = {
	canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>;
	blurhashString: string;
	width?: number;
	height?: number;
	// punch?: number;
	onLoad?: () => void;
	onError?: (error: Error) => void;
};

const BlurhashCanvas = ({
	canvasProps,
	blurhashString,
	width,
	height,
	// punch,
	onLoad,
	onError,
}: BlurhashCanvasProps) => {
	const canvasRef = React.useRef<HTMLCanvasElement>(null);
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const drawBlurhash = async () => {
			try {
				const imageDataBuffer = blurhash.decode(
					blurhashString,
					width || 32,
					height || 32,
					// punch || 1,
				);
				// canvas.width = width || 32;
				// canvas.height = height || 32;
				if (!imageDataBuffer) {
					throw new Error("Failed to decode blurhash");
				}
				const imageData = new ImageData(
					new Uint8ClampedArray(imageDataBuffer),
					width || 32,
					height || 32,
				);
				// imageData.data.set(imageDataBuffer);
				ctx.putImageData(imageData, 0, 0);
				if (onLoad) onLoad();
			} catch (error) {
				if (onError) onError(error as Error);
				else console.error("Error decoding blurhash:", error);
			}
		};
		drawBlurhash();
	}, [blurhash, width, height, onLoad, onError]);
	return <canvas ref={canvasRef} {...canvasProps} />;
};

export default BlurhashCanvas;
