/** @format */
import { useEffect, useRef, useState } from "react";

import { motion } from "framer-motion";

import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";

import WaveSurfer from "wavesurfer.js";

import { useAudioPlayback } from "../../../utils/store/audioPlayback";

import "./audioPlayer.module.scss";
import { MdiPlay } from "../../icons/mdiPlay";
import { MdiPause } from "../../icons/mdiPause";
import { AnimatePresence } from "framer-motion";

import { getRuntimeMusic, secToTicks } from "../../../utils/date/time";

const AudioPlayer = () => {
	const waveSurferRef = useRef(null);
	const waveSurferContainerRef = useRef(null);
	const [playing, setPlaying] = useState(true);

	const [currentTime, setCurrentTime] = useState(0);

	const [url, display, item] = useAudioPlayback((state) => [
		state.url,
		state.display,
		state.item,
	]);

	useEffect(() => {
		if (display) {
			const waveSurfer = WaveSurfer.create({
				container: waveSurferContainerRef.current,
				// autoplay: true,
				barHeight: 0.6,
				dragToSeek: true,
				height: 25,
				cursorColor: "#fb2376",
				progressColor: "#fb2376",
			});
			waveSurfer.load(url);
			waveSurfer.on("ready", () => {
				waveSurferRef.current = waveSurfer;
			});
			waveSurfer.on("timeupdate", (e) => {
				console.log(e);
				setCurrentTime(e);
			});
			return () => {
				waveSurfer.destroy();
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
					<div className="audio-player-info">
						<img
							className="audio-player-image"
							src={window.api.getItemImageUrl(
								item.Id,
								"Primary",
								{
									quality: 85,
									fillHeight: 462,
									fillWidth: 462,
								},
							)}
						/>
						<div className="audio-player-info-text">
							<Typography noWrap variant="subtitle1">
								{item.Name}
							</Typography>
							<Typography
								noWrap
								variant="subtitle2"
								style={{
									opacity: 0.5,
								}}
							>
								{item.Artists.map(
									(artist) => artist,
								).join(",")}
							</Typography>
						</div>
					</div>
					<div className="audio-player-controls">
						<IconButton onClick={handlePlayPause}>
							{playing ? <MdiPause /> : <MdiPlay />}
						</IconButton>
						<div
							style={{
								width: "100%",
								display: "flex",
								gap: "1em",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<Typography variant="subtitle2">
								{getRuntimeMusic(
									secToTicks(currentTime),
								)}
							</Typography>
							<div
								id="waveform"
								ref={waveSurferContainerRef}
							></div>
							<Typography variant="subtitle2">
								{getRuntimeMusic(item.RunTimeTicks)}
							</Typography>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default AudioPlayer;
