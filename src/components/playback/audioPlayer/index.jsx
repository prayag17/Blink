/** @format */
import { useEffect, useRef, useState } from "react";

import { motion } from "framer-motion";

import WaveSurfer from "wavesurfer.js";

import { useAudioPlayback } from "../../../utils/store/audioPlayback";

import "./audioPlayer.module.scss";
import IconButton from "@mui/material/IconButton";
import { MdiPlay } from "../../icons/mdiPlay";
import { MdiPause } from "../../icons/mdiPause";
import { AnimatePresence } from "framer-motion";

const AudioPlayer = () => {
	const waveSurferRef = useRef(null);
	const waveSurferContainerRef = useRef(null);
	const [playing, setPlaying] = useState(true);

	const [url, display, item] = useAudioPlayback((state) => [
		state.url,
		state.display,
		state.item,
	]);

	const [waveSurf, setWaveSurf] = useState(null);

	useEffect(() => {
		console.log(url);
		if (display) {
			const waverSurfer = WaveSurfer.create({
				container: waveSurferContainerRef.current,
				autoplay: true,
				barHeight: 0.6,
				dragToSeek: true,
				height: 25,
				cursorColor: "#fb2376",
				progressColor: "#fb2376",
			});
			waverSurfer.load(url);
			waverSurfer.on("ready", () => {
				waveSurferRef.current = waverSurfer;
			});
			return () => {
				waverSurfer.destroy();
			};
		}
	}, [url]);

	const handlePlayPause = () => {
		waveSurferRef.current.playPause();
		setPlaying(!playing);
	};

	return (
		<AnimatePresence>
			{display && (
				<motion.div
					initial={{
						transform: "translateY(100%)",
					}}
					animate={{ transform: "translateY(0)" }}
					className="audio-player"
				>
					<div className="audio-player-info">{item.Name}</div>
					<div className="audio-player-controls">
						<IconButton onClick={handlePlayPause}>
							{playing ? <MdiPause /> : <MdiPlay />}
						</IconButton>
						<div
							id="waveform"
							ref={waveSurferContainerRef}
						></div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default AudioPlayer;
