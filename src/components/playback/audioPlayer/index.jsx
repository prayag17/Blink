import React, {
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import { motion } from "framer-motion";

import CircularProgress from "@mui/material/CircularProgress";
import Fab from "@mui/material/Fab";
import Grow from "@mui/material/Grow";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";

import WaveSurfer from "wavesurfer.js";

import { useAudioPlayback } from "../../../utils/store/audioPlayback";
import useQueue, { setTrackIndex } from "../../../utils/store/queue";

import { AnimatePresence } from "framer-motion";
import "./audioPlayer.module.scss";

import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { useQuery } from "@tanstack/react-query";
import { getRuntimeMusic, secToTicks } from "../../../utils/date/time";

import { getPlaystateApi } from "@jellyfin/sdk/lib/utils/api/playstate-api";
import { theme } from "../../../theme";
import { useApi } from "../../../utils/store/api";
import MusicTrack from "../../musicTrack";

const AudioPlayer = () => {
	const [api] = useApi((state) => [state.api]);
	const [
		url,
		display,
		item,
		// tracks,
		// currentTrack,
		setCurrentTrack,
		setAudioUrl,
		setAudioItem,
		setAudioTracks,
		resetPlayer,
		playlistItemId,
	] = useAudioPlayback((state) => [
		state.url,
		state.display,
		state.item,
		// state.tracks,
		// state.currentTrack,
		state.setCurrentTrack,
		state.setUrl,
		state.setItem,
		state.setTracks,
		state.reset,
		state.playlistItemId,
	]);

	const [tracks, currentTrack] = useQueue((state) => [
		state.tracks,
		state.currentItemIndex,
	]);

	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			const usr = await getUserApi(api).getCurrentUser();
			return usr.data;
		},
		networkMode: "always",
		enabled: Boolean(display),
	});

	const waveSurferRef = useRef(null);
	const waveSurferContainerRef = useRef(null);

	const [playerReady, setPlayerReady] = useState(false);
	const [playing, setPlaying] = useState(true);
	const [volume, setVolume] = useState(0.8);
	const [isMuted, setIsMuted] = useState(false);

	const [loading, setLoading] = useState(true);

	const [showWaveform, setShowWaveform] = useState(false);

	const [currentTime, setCurrentTime] = useState(0);

	const [queueButton, setQueueButton] = useState(null);
	const handleOpenQueue = (event) => {
		setQueueButton(queueButton ? null : event.currentTarget);
	};

	useEffect(() => {
		if (display) {
			const waveSurfer = WaveSurfer.create({
				container: waveSurferContainerRef.current,
				dragToSeek: true,
				height: 25,
				cursorColor: "#fb2376",
				progressColor: "#fb2376",
				waveColor: "#ffffff2f",
				normalize: true,
				barHeight: 0.6,
				backend: "MediaElementWebAudio",
			});
			waveSurfer.load(url);
			waveSurfer.on("load", () => {
				setLoading(true);
			});
			waveSurfer.on("ready", () => {
				waveSurferRef.current = waveSurfer;
				waveSurfer.play();
				waveSurfer.setVolume(volume);
				waveSurfer.setMuted(isMuted);
				setPlayerReady(true);
				setLoading(false);
			});
			waveSurfer.on("timeupdate", async (atime) => {
				setCurrentTime(atime);
			});
			waveSurfer.on("redraw", () => {
				setShowWaveform(true);
			});
			waveSurfer.on("play", () => {
				setPlaying(true);
			});
			waveSurfer.on("pause", () => {
				setPlaying(false);
			});
			waveSurfer.on("finish", () => {
				setPlaying(false);
				if (currentTrack !== tracks.length - 1) {
					setCurrentTrack(currentTrack + 1);
					setAudioUrl(
						`${api.basePath}/Audio/${
							tracks[currentTrack + 1].Id
						}/universal?deviceId=${api.deviceInfo.id}&userId=${
							user.data.Id
						}&api_key=${api.accessToken}`,
					);
					setAudioItem(tracks[currentTrack + 1]);
					setShowWaveform(false);
				}
			});
			waveSurfer.on("destroy", () => {
				waveSurfer.unAll();
				setLoading(true);
			});

			return () => {
				waveSurfer.destroy();
			};
		}
	}, [url, currentTrack]);

	useLayoutEffect(() => {
		if (playerReady) {
			waveSurferRef.current.setVolume(volume);
			waveSurferRef.current.setMuted(isMuted);
		}
	}, [playerReady, volume, isMuted]);

	const handlePlayPause = () => {
		waveSurferRef.current.playPause();
	};

	const handleNext = () => {
		setPlaying(false);
		// setCurrentTrack(currentTrack + 1);
		setAudioUrl(
			`${api.basePath}/Audio/${
				tracks[currentTrack + 1].Id
			}/universal?deviceId=${api.deviceInfo.id}&userId=${
				user.data.Id
			}&api_key=${api.accessToken}`,
		);

		setTrackIndex(currentTrack + 1);

		// console.info(tracks[currentTrack + 1]);

		console.log(currentTrack);
		// setAudioItem(tracks[currentTrack + 1]);
		setShowWaveform(false);
	};

	const handlePrevious = () => {
		setPlaying(false);
		// setCurrentTrack(currentTrack - 1);
		setAudioUrl(
			`${api.basePath}/Audio/${
				tracks[currentTrack - 1].Id
			}/universal?deviceId=${api.deviceInfo.id}&userId=${
				user.data.Id
			}&api_key=${api.accessToken}`,
		);
		setTrackIndex(currentTrack - 1);
		// setAudioItem(tracks[currentTrack - 1]);
		setShowWaveform(false);
	};

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
						alt={tracks[currentTrack].Name}
						className="audio-player-image"
						src={api.getItemImageUrl(
							Object.keys(tracks[currentTrack].ImageTags).length === 0
								? item.AlbumId
								: item.Id,
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
						variant="subtitle1"
						style={{
							width: "100%",
						}}
						fontWeight={500}
					>
						{tracks[currentTrack].IndexNumber
							? `${tracks[currentTrack].IndexNumber}. ${tracks[currentTrack].Name}`
							: tracks[currentTrack].Name}
					</Typography>
					<Typography
						variant="subtitle2"
						style={{
							opacity: 0.5,
						}}
						noWrap
						fontWeight={400}
					>
						by {tracks[currentTrack].Artists.map((artist) => artist).join(",")}
					</Typography>
				</div>
			</div>
		),
		[currentTrack],
	);

	const controls = useMemo(
		() => (
			<div style={{ display: "flex", gap: "1em" }}>
				<IconButton onClick={handlePrevious} disabled={currentTrack === 0}>
					<div className="material-symbols-rounded">skip_previous</div>
				</IconButton>
				<div
					style={{
						display: "inline-flex",
						alignItems: "center",
						justifyContent: "center",
						position: "relative",
					}}
				>
					<CircularProgress
						size={48}
						style={{
							position: "absolute",
							zIndex: 1,
							opacity: loading ? 1 : 0,
							transition: "opacity 500ms",
						}}
					/>
					<Fab size="small" onClick={handlePlayPause}>
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
				<IconButton
					onClick={handleNext}
					disabled={tracks.length - 1 === currentTrack}
				>
					<div className="material-symbols-rounded">skip_next</div>
				</IconButton>
			</div>
		),
		[currentTrack, loading, playing, tracks.length],
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
				<Popper
					open={Boolean(queueButton)}
					anchorEl={queueButton}
					placement="top"
					style={{
						zIndex: 100,
					}}
					disablePortal
					modifiers={[
						{
							name: "flip",
							enabled: true,
							options: {
								altBoundary: true,
								rootBoundary: "document",
								padding: 8,
							},
						},
						{
							name: "preventOverflow",
							enabled: true,
							options: {
								altAxis: true,
								altBoundary: true,
								tether: true,
								rootBoundary: "document",
								padding: 8,
							},
						},
					]}
					transition
				>
					{({ TransitionProps }) => (
						<Grow
							{...TransitionProps}
							style={{
								transformOrigin: "50% 100% 0",
							}}
							timeout={250}
						>
							<Paper
								className="audio-player-playlist"
								style={{
									padding: "1em",
									display: "flex",
									flexDirection: "column",
									width: "34em",
									maxHeight: "24em",
									overflowY: "auto",
									borderRadius: "20px",
									marginBottom: "2.4em",
								}}
							>
								{tracks.map((track, index) => {
									return (
										<div
											className={
												track.Id === tracks[currentTrack].Id
													? "audio-player-playlist-track active"
													: "audio-player-playlist-track"
											}
											onClick={() => setTrackIndex(index)}
										>
											<div className="audio-player-playlist-track-image">
												{Object.keys(track.ImageTags).includes("Primary") ? (
													<img
														alt={track.Name}
														src={api.getItemImageUrl(track.Id, "Primary", {
															quality: 80,
															tag: track.ImageTags["Primary"],
															fillWidth: 92,
															fillHeight: 92,
														})}
														style={{
															width: "inherit",
															height: "inherit",
															objectFit: "cover",
														}}
													/>
												) : track.AlbumPrimaryImageTag ? (
													<img
														alt={track.Name}
														src={api.getItemImageUrl(track.AlbumId, "Primary", {
															quality: 80,
															tag: track.AlbumPrimaryImageTag,
															fillWidth: 102,
															fillHeight: 102,
														})}
														style={{
															width: "inherit",
															height: "inherit",
															objectFit: "cover",
														}}
													/>
												) : (
													<></>
												)}
											</div>
											<div>
												<Typography variant="subtitle1">
													{track.Name}
												</Typography>
												<Typography
													variant="caption"
													style={{
														opacity: 0.5,
													}}
												>
													{track.Artists.join(", ")}
												</Typography>
											</div>
											<Typography variant="subtitle2">
												{getRuntimeMusic(track.RunTimeTicks)}
											</Typography>
										</div>
									);
								})}
							</Paper>
						</Grow>
					)}
				</Popper>
				<IconButton onClick={handleOpenQueue}>
					<div className="material-symbols-rounded">queue_music</div>
				</IconButton>
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
					onChange={(e, newVal) => setVolume(newVal / 100)}
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
				<IconButton onClick={resetPlayer}>
					<div className="material-symbols-rounded">close</div>
				</IconButton>
			</div>
		),
		[queueButton, volume, isMuted, currentTrack],
	);

	return (
		<AnimatePresence mode="sync">
			<motion.div
				initial={{
					transform: "translateY(100%)",
				}}
				animate={{ transform: "translateY(0)" }}
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
				className="audio-player"
			>
				{/* <motion.div
						initial={{
							filter: "opacity(0)",
						}}
						animate={{
							filter: "opacity(1)",
						}}
						exit={{
							filter: "opacity(0)",
						}}
						className="audio-player-info"
					>
						<div className="audio-player-image-container">
							<img
								alt={tracks[currentTrack].Name}
								className="audio-player-image"
								src={api.getItemImageUrl(
									Object.keys(tracks[currentTrack].ImageTags).length === 0
										? item.AlbumId
										: item.Id,
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
								variant="subtitle1"
								style={{
									width: "100%",
								}}
								fontWeight={500}
							>
								{tracks[currentTrack].IndexNumber
									? `${tracks[currentTrack].IndexNumber}. ${tracks[currentTrack].Name}`
									: tracks[currentTrack].Name}
							</Typography>
							<Typography
								variant="subtitle2"
								style={{
									opacity: 0.5,
								}}
								noWrap
								fontWeight={400}
							>
								by{" "}
								{tracks[currentTrack].Artists.map((artist) => artist).join(",")}
							</Typography>
						</div>
					</motion.div> */}
				{info}

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
							{getRuntimeMusic(secToTicks(currentTime))}
						</Typography>
						<div
							id="waveform"
							ref={waveSurferContainerRef}
							data-show={Boolean(showWaveform)}
						/>
						<Typography
							variant="subtitle2"
							fontWeight={300}
							style={{
								opacity: 0.8,
							}}
						>
							{getRuntimeMusic(tracks[currentTrack].RunTimeTicks)}
						</Typography>
					</div>
				</div>
				{buttons}
			</motion.div>
		</AnimatePresence>
	);
};

export default AudioPlayer;
