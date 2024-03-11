import React, { useEffect, useState } from "react";
import { useLayoutEffect, useRef } from "react";

import RxPlayerRaw from "rx-player";

const RxPlayer = ({ playing, url, onProgress }) => {
	const videoRef = useRef(null);
	const [player, setPlayer] = useState<RxPlayerRaw>();
	useLayoutEffect(() => {
		console.info("Video tag mounted!");
		const playerObject = new RxPlayerRaw({
			videoElement: videoRef.current,
		});
		setPlayer(playerObject);
		playerObject.loadVideo({
			url: url,
			transport: "directfile",
			autoPlay: true,
		});
		playerObject.addEventListener("positionUpdate", onProgress());

		// player.pause();
	}, []);

	useEffect(() => {
		if (playing) {
			player?.play();
		} else {
			player?.pause();
		}
	}, [playing]);

	return (
		// biome-ignore lint/a11y/useMediaCaption: <explanation>
		<video
			ref={videoRef}
			style={{
				width: "100vw",
				height: "100vh",
				zIndex: 100,
			}}
			className="video-player-element"
			controls
			// autoPlay
		/>
	);
};

export default RxPlayer;
