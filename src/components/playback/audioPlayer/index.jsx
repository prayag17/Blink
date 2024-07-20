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

import { useAudioPlayback } from "@/utils/store/audioPlayback";
import useQueue from "@/utils/store/queue";

import { AnimatePresence } from "framer-motion";
import "./audioPlayer.scss";

import { getRuntimeMusic, secToTicks } from "@/utils/date/time";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { useQuery } from "@tanstack/react-query";

import PlayNextButton from "@/components/buttons/playNextButton";
import PlayPreviousButton from "@/components/buttons/playPreviousButtom";
import QueueButton from "@/components/buttons/queueButton";
import { useApiInContext } from "@/utils/store/api";
import { useRouteContext } from "@tanstack/react-router";

const AudioPlayer = () => {
	const api = useApiInContext((s) => s.api);
	const [
		url,
		display,
		item,
		// tracks,
		// currentTrack,
		setCurrentTrack,
	] = useAudioPlayback((state) => [
		state.url,
		state.display,
		state.item,
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
						alt={tracks[currentTrack]?.Name}
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
						by {item?.Artists.map((artist) => artist).join(",")}
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

	return (
		<AnimatePresence mode="sync">
			{display && (
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
					className="audio-player glass"
				>
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
