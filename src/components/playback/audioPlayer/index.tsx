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
import { useApiInContext } from "@/utils/store/api";
import { useCentralStore } from "@/utils/store/central";
import { playItemFromQueue } from "@/utils/store/playback";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

const AudioPlayer = () => {
	const api = useApiInContext((s) => s.api);
	const audioRef = useRef<HTMLAudioElement>(null!);
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
	const [playerReady, setPlayerReady] = useState(false);
	const [volume, setVolume] = useState(0.8);
	const [isMuted, setIsMuted] = useState(false);
	const [progress, setProgress] = useState(0);
	const [isScrubbing, setIsScrubbing] = useState(false);
	const [sliderProgress, setSliderProgress] = useState(0);

	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (display) {
			const audioUrlRequest = new Request(audioRef.current?.dataset.src, {
				method: "GET",
				headers: {
					Authorization: api.authorizationHeader,
				},
			});

			const currentTrackItem = tracks[currentTrack];

			fetch(audioUrlRequest)
				.then((res) => res)
				.then(async (result) => {
					const blob = await result.blob();
					const blobUrl = URL.createObjectURL(blob);
					audioRef.current.src = blobUrl;
					await audioRef.current.play();
					if ("mediaSession" in navigator) {
						navigator.mediaSession.playbackState = "playing";
						navigator.mediaSession.metadata = new MediaMetadata({
							title: currentTrackItem.Name ?? "Unknown audio",
							artist: currentTrackItem.Artists?.join(", "),
							album: currentTrackItem.Album ?? "",
							artwork: [
								{
									src: api.getItemImageUrl(currentTrackItem.Id, "Primary", {
										tag: currentTrackItem.ImageTags?.Primary,
										width: 96,
										height: 96,
									}),
									sizes: "96x96",
									type: "image/jpeg",
								},
								{
									src: api.getItemImageUrl(currentTrackItem.Id, "Primary", {
										tag: currentTrackItem.ImageTags?.Primary,
										width: 128,
										height: 128,
									}),
									sizes: "128x128",
									type: "image/jpeg",
								},
								{
									src: api.getItemImageUrl(currentTrackItem.Id, "Primary", {
										tag: currentTrackItem.ImageTags?.Primary,
										width: 192,
										height: 192,
									}),
									sizes: "192x192",
									type: "image/jpeg",
								},
								{
									src: api.getItemImageUrl(currentTrackItem.Id, "Primary", {
										tag: currentTrackItem.ImageTags?.Primary,
										width: 256,
										height: 256,
									}),
									sizes: "256x256",
									type: "image/jpeg",
								},
								{
									src: api.getItemImageUrl(currentTrackItem.Id, "Primary", {
										tag: currentTrackItem.ImageTags?.Primary,
										width: 384,
										height: 384,
									}),
									sizes: "384x384",
									type: "image/jpeg",
								},
								{
									src: api.getItemImageUrl(currentTrackItem.Id, "Primary", {
										tag: currentTrackItem.ImageTags?.Primary,
										width: 512,
										height: 512,
									}),
									sizes: "512x512",
									type: "image/jpeg",
								},
							],
						});
						console.log("Using MediaSession Api");
						// navigator.mediaSession.setActionHandler("play", () => {
						// 	/* Code excerpted. */
						// });
						// navigator.mediaSession.setActionHandler("pause", () => {
						// 	/* Code excerpted. */
						// });
						// navigator.mediaSession.setActionHandler("stop", () => {
						// 	/* Code excerpted. */
						// });
						// navigator.mediaSession.setActionHandler("seekbackward", () => {
						// 	/* Code excerpted. */
						// });
						// navigator.mediaSession.setActionHandler("seekforward", () => {
						// 	/* Code excerpted. */
						// });
						// navigator.mediaSession.setActionHandler("seekto", () => {
						// 	/* Code excerpted. */
						// });
						// navigator.mediaSession.setActionHandler("previoustrack", () => {
						// 	/* Code excerpted. */
						// });
						// navigator.mediaSession.setActionHandler("nexttrack", () => {
						// 	/* Code excerpted. */
						// });
						// navigator.mediaSession.setActionHandler("skipad", () => {
						// 	/* Code excerpted. */
						// });
						// navigator.mediaSession.setActionHandler("togglecamera", () => {
						// 	/* Code excerpted. */
						// });
						// navigator.mediaSession.setActionHandler("togglemicrophone", () => {
						// 	/* Code excerpted. */
						// });
						// navigator.mediaSession.setActionHandler("hangup", () => {
						// 	/* Code excerpted. */
						// });
					}
					setLoading(false);
				});
			setAudioRef(audioRef);
		}
	}, [url, tracks[currentTrack]?.Id]);

	const navigate = useNavigate();

	const info = useMemo(
		() => (
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
						alt={tracks[currentTrack]?.Name ?? "track"}
						className="audio-player-image"
						src={api?.getItemImageUrl(
							!item?.ImageTags.Primary ? item?.AlbumId : item?.Id,
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
		[tracks[currentTrack]?.Id, currentTrack],
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
							audioRef.current.paused
								? audioRef.current.play()
								: audioRef.current.pause()
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
		[tracks[currentTrack]?.Id, loading, playing, tracks.length],
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
					onClick={(e) => {
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
						Array.isArray(newVal)
							? setVolume(newVal[0] / 100)
							: setVolume(newVal / 100);
						audioRef.current.volume = newVal / 100;
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

	if (audioRef.current) {
		audioRef.current.addEventListener("ended", () => {
			if (tracks[currentTrack + 1]?.Id) {
				playItemFromQueue("next", user?.Id, api);
			}
		});
	}

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
						data-src={url}
						ref={audioRef}
						key={item?.Id}
						onTimeUpdate={(e) =>
							setProgress(secToTicks(e.currentTarget.currentTime))
						}
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
									setIsScrubbing(false);
									// console.log(ticksToSec(value * item?.RunTimeTicks));
									setProgress(value);
									audioRef.current.currentTime = ticksToSec(value);
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
