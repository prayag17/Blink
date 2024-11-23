import React, { useEffect, useMemo, useRef, useState } from "react";

import { motion } from "framer-motion";

import Fab from "@mui/material/Fab";
import IconButton from "@mui/material/IconButton";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";

import { setAudioRef, useAudioPlayback } from "@/utils/store/audioPlayback";
import useQueue from "@/utils/store/queue";

import { AnimatePresence } from "framer-motion";
import "./audioPlayer.scss";

import { getRuntimeMusic, secToTicks, ticksToSec } from "@/utils/date/time";

import PlayNextButton from "@/components/buttons/playNextButton";
import PlayPreviousButton from "@/components/buttons/playPreviousButtom";
import QueueButton from "@/components/buttons/queueButton";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import { useApiInContext } from "@/utils/store/api";
import { useCentralStore } from "@/utils/store/central";
import { playItemFromQueue } from "@/utils/store/playback";
import { useNavigate } from "@tanstack/react-router";

const AudioPlayer = () => {
	const api = useApiInContext((s) => s.api);

	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [url, display, item] = useAudioPlayback((state) => [
		state.url,
		state.display,
		state.item,
	]);

	const [tracks, currentTrack] = useQueue((state) => [
		state.tracks,
		state.currentItemIndex,
	]);

	const user = useCentralStore((s) => s.currentUser);

	const playing = useMemo(() => {
		if (audioRef.current?.paused) return false;
		return true;
	}, [audioRef.current?.paused]);
	const [volume, setVolume] = useState(0.8);
	const [isMuted, setIsMuted] = useState(false);
	const [progress, setProgress] = useState(0);
	const [isScrubbing, setIsScrubbing] = useState(false);
	const [sliderProgress, setSliderProgress] = useState(0);

	useEffect(() => {
		if (display) {
			// const audioUrlRequest = new Request(audioRef.current?.dataset.src, {
			// 	method: "GET",
			// 	headers: {
			// 		Authorization: api.authorizationHeader,
			// 	},
			// });
			// fetch(audioUrlRequest)
			// 	.then((res) => res)
			// 	.then(async (result) => {
			// 		const blob = await result.blob();
			// 		const blobUrl = URL.createObjectURL(blob);
			// 		audioRef.current.src = blobUrl;
			// 		await audioRef.current.play();
			// 		setLoading(false);
			// 	});

			// Set the audio ref in the store to allow for global control
			setAudioRef(audioRef);
		}
	}, [url, tracks?.[currentTrack]?.Id]);

	const navigate = useNavigate();

	const info = useMemo(
		() =>
			api && (
				<div
					// initial={{
					// 	filter: "opacity(0)",
					// }}
					// animate={{
					// 	filter: "opacity(1)",
					// }}
					// exit={{
					// 	filter: "opacity(0)",
					// }}
					className="audio-player-info"
				>
					<div className="audio-player-image-container">
						<img
							alt={tracks?.[currentTrack]?.Name ?? "track"}
							className="audio-player-image"
							src={getImageUrlsApi(api).getItemImageUrlById(
								(!item?.ImageTags?.Primary ? item?.AlbumId : item.Id) ?? "",
								"Primary",
								{
									quality: 85,
									fillHeight: 462,
									fillWidth: 462,
								},
							)}
						/>
						<span className="material-symbols-rounded audio-player-image-icon">
							music_note
						</span>
					</div>
					<div className="audio-player-info-text">
						<Typography
							variant="subtitle2"
							style={{
								width: "100%",
							}}
						>
							{item?.Name}
						</Typography>
						<Typography
							variant="caption"
							style={{
								opacity: 0.5,
							}}
							noWrap
						>
							by {item?.Artists?.map((artist) => artist).join(",")}
						</Typography>
					</div>
				</div>
			),
		[tracks?.[currentTrack]?.Id, currentTrack, api?.configuration],
	);

	const controls = useMemo(
		() => (
			<div style={{ display: "flex", gap: "1em" }}>
				<PlayPreviousButton />
				<div
					style={{
						display: "inline-flex",
						alignItems: "center",
						justifyContent: "center",
						position: "relative",
					}}
				>
					<Fab
						size="small"
						onClick={() =>
							audioRef.current?.paused
								? audioRef.current.play()
								: audioRef.current?.pause()
						}
					>
						<div
							className="material-symbols-rounded"
							style={{
								fontSize: "2em",
							}}
						>
							{playing ? "pause" : "play_arrow"}
						</div>
					</Fab>
				</div>
				<PlayNextButton />
			</div>
		),
		[tracks?.[currentTrack]?.Id, playing, tracks?.length],
	);

	const buttons = useMemo(
		() => (
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "flex-end",
				}}
			>
				<IconButton onClick={() => navigate({ to: "/player/audio" })}>
					<span className="material-symbols-rounded">info</span>
				</IconButton>
				<QueueButton />
				<IconButton
					onClick={() => {
						setIsMuted(!isMuted);
					}}
				>
					<div className="material-symbols-rounded">
						{isMuted ? "volume_mute" : "volume_up"}
					</div>
				</IconButton>
				<Slider
					value={isMuted ? 0 : volume * 100}
					step={1}
					max={100}
					onChange={(_, newVal) => {
						if (!audioRef.current) {
							console.error("Audio ref not found");
							return;
						}
						Array.isArray(newVal)
							? setVolume(newVal[0] / 100)
							: setVolume(newVal / 100);
						if (Array.isArray(newVal)) {
							audioRef.current.volume = newVal[0] / 100;
						} else {
							audioRef.current.volume = newVal / 100;
						}
					}}
					valueLabelDisplay="auto"
					valueLabelFormat={(value) => Math.floor(value)}
					size="small"
					sx={{
						mr: 1,
						ml: 1,
						width: "10em",
						"& .MuiSlider-valueLabel": {
							lineHeight: 1.2,
							fontSize: 24,
							background: "rgb(0 0 0 / 0.5)",
							backdropFilter: "blur(5px)",
							padding: 1,
							borderRadius: "10px",
							border: "1px solid rgb(255 255 255 / 0.15)",
							boxShadow: "0 0 10px rgb(0 0 0 / 0.4) ",
							transform: "translatey(-120%) scale(0)",
							"&:before": {
								display: "none",
							},
							"&.MuiSlider-valueLabelOpen": {
								transform: "translateY(-120%) scale(1)",
							},
							"& > *": {
								transform: "rotate(0deg)",
							},
						},
					}}
				/>
				<IconButton
					onClick={() => {
						useAudioPlayback.setState(useAudioPlayback.getInitialState());
					}}
				>
					<div className="material-symbols-rounded">close</div>
				</IconButton>
			</div>
		),
		[volume, isMuted, currentTrack],
	);

	// if (audioRef.current) {
	// 	audioRef.current.addEventListener("change", () => {
	// 		console.log("Audio Player changed state : ", currentTrack);
	// 	});
	// 	audioRef.current.addEventListener("ended", () => {

	// 	});
	// }

	return (
		<AnimatePresence mode="sync">
			{display && (
				<motion.div
					initial={{
						transform: "translateY(100%)",
					}}
					animate={{
						transform:
							location.pathname === "/player/audio"
								? "translateY(100%)"
								: "translateY(0%)",
					}}
					exit={{
						transform: "translateY(100%)",
					}}
					style={{
						width: "100%",
					}}
					transition={{
						duration: 0.2,
						ease: "easeInOut",
					}}
					className="audio-player glass"
				>
					{info}
					<audio
						autoPlay
						src={url}
						ref={audioRef}
						key={item?.Id ?? "noItem"}
						onTimeUpdate={(e) =>
							setProgress(secToTicks(e.currentTarget.currentTime))
						}
						onEnded={() => {
							if (tracks?.[currentTrack + 1]?.Id && api && user?.Id) {
								playItemFromQueue("next", user.Id, api);
							}
						}}
						id="audio-player"
					/>
					<div className="audio-player-controls">
						{controls}
						<div
							style={{
								width: "100%",
								display: "flex",
								gap: "1em",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<Typography
								variant="subtitle2"
								fontWeight={300}
								style={{
									opacity: 0.8,
								}}
							>
								{getRuntimeMusic(progress)}
							</Typography>
							<Slider
								value={isScrubbing ? sliderProgress : progress}
								step={1}
								size="small"
								max={item?.RunTimeTicks ?? 1}
								onChange={(_, value) => {
									setIsScrubbing(true);
									Array.isArray(value)
										? setSliderProgress(value[0])
										: setSliderProgress(value);
								}}
								onChangeCommitted={(_, value) => {
									if (!audioRef.current) {
										console.error("Audio ref not found");
										return;
									}
									setIsScrubbing(false);
									// console.log(ticksToSec(value * item.RunTimeTicks));
									Array.isArray(value)
										? setProgress(value[0])
										: setProgress(value);
									if (Array.isArray(value)) {
										audioRef.current.currentTime = ticksToSec(value[0]);
									} else {
										audioRef.current.currentTime = ticksToSec(value);
									}
								}}
							/>
							<Typography
								variant="subtitle2"
								fontWeight={300}
								style={{
									opacity: 0.8,
								}}
							>
								{getRuntimeMusic(item?.RunTimeTicks ?? 0)}
							</Typography>
						</div>
					</div>
					{buttons}
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default AudioPlayer;
