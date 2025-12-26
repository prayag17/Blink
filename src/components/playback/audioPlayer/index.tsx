import { useLocation, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import React, { type SyntheticEvent, useEffect, useRef, useState } from "react";
import { secToTicks, ticksToSec } from "@/utils/date/time";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import { useApiInContext } from "@/utils/store/api";
import {
	setAudioRef,
	setIsMuted,
	setVolume,
	useAudioPlayback,
} from "@/utils/store/audioPlayback";
import { useCentralStore } from "@/utils/store/central";
import { playItemFromQueue } from "@/utils/store/playback";
import useQueue from "@/utils/store/queue";
import PlayerActions from "./components/PlayerActions";
import PlayerControls from "./components/PlayerControls";
import PlayerInfo from "./components/PlayerInfo";
import PlayerProgress from "./components/PlayerProgress";
import PlayerVolume from "./components/PlayerVolume";

import "./audioPlayer.scss";

const AudioPlayer = () => {
	const api = useApiInContext((s) => s.api);
	const user = useCentralStore((s) => s.currentUser);
	const navigate = useNavigate();
	const location = useLocation();

	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [url, display, item, volume, isMuted] = useAudioPlayback((state) => [
		state.url,
		state.display,
		state.item,
		state.player.volume,
		state.player.isMuted,
	]);

	const [tracks, currentTrack] = useQueue((state) => [
		state.tracks,
		state.currentItemIndex,
	]);

	const [playing, setPlaying] = useState(false);
	const [progress, setProgress] = useState(0);

	// Sync volume and ref
	useEffect(() => {
		if (display) {
			setAudioRef(audioRef);
			if (audioRef.current) {
				audioRef.current.volume = isMuted ? 0 : volume;
			}
		}
	}, [display, url, tracks?.[currentTrack]?.Id]);

	// Update volume when state changes
	useEffect(() => {
		if (audioRef.current) {
			audioRef.current.volume = isMuted ? 0 : volume;
		}
	}, [volume, isMuted]);

	// Media Session Metadata
	useEffect(() => {
		if ("mediaSession" in navigator && item) {
			const imageUrl = item.ImageTags?.Primary
				? api &&
					getImageUrlsApi(api).getItemImageUrlById(item.Id ?? "", "Primary", {
						tag: item.ImageTags.Primary,
					})
				: undefined;

			navigator.mediaSession.metadata = new MediaMetadata({
				title: item.Name ?? "Unknown Title",
				artist: item.Artists?.join(", ") ?? "Unknown Artist",
				album: item.Album ?? "Unknown Album",
				artwork: imageUrl
					? [
							{
								src: imageUrl,
								sizes: "512x512",
								type: "image/jpeg",
							},
						]
					: [],
			});
		}
	}, [item, api]);

	// Media Session Action Handlers
	useEffect(() => {
		if ("mediaSession" in navigator) {
			navigator.mediaSession.setActionHandler("play", () => {
				audioRef.current?.play();
			});
			navigator.mediaSession.setActionHandler("pause", () => {
				audioRef.current?.pause();
			});
			navigator.mediaSession.setActionHandler("previoustrack", () => {
				if (user?.Id && api) {
					playItemFromQueue("previous", user.Id, api);
				}
			});
			navigator.mediaSession.setActionHandler("nexttrack", () => {
				if (user?.Id && api) {
					playItemFromQueue("next", user.Id, api);
				}
			});
			navigator.mediaSession.setActionHandler("seekto", (details) => {
				if (audioRef.current && details.seekTime !== undefined) {
					audioRef.current.currentTime = details.seekTime;
				}
			});
		}
	}, [api, user?.Id]);

	const updatePositionState = () => {
		if (
			"mediaSession" in navigator &&
			audioRef.current &&
			!Number.isNaN(audioRef.current.duration)
		) {
			try {
				navigator.mediaSession.setPositionState({
					duration: audioRef.current.duration,
					playbackRate: audioRef.current.playbackRate,
					position: audioRef.current.currentTime,
				});
			} catch (error) {
				console.error("Error updating media session position state:", error);
			}
		}
	};

	const handlePlayPause = () => {
		if (audioRef.current) {
			if (audioRef.current.paused) {
				audioRef.current.play();
				setPlaying(true);
			} else {
				audioRef.current.pause();
				setPlaying(false);
			}
		}
	};

	const handleTimeUpdate = (e: SyntheticEvent<HTMLAudioElement>) => {
		setProgress(secToTicks(e.currentTarget.currentTime));
	};

	const handleEnded = () => {
		setPlaying(false);
		if (tracks?.[currentTrack + 1]?.Id && api && user?.Id) {
			playItemFromQueue("next", user.Id, api);
		}
	};

	const handleSeekCommit = (value: number) => {
		if (audioRef.current) {
			audioRef.current.currentTime = ticksToSec(value);
			setProgress(value);
		}
	};

	const handleVolumeChange = (newVolume: number) => {
		setVolume(newVolume);
	};

	const handleMuteToggle = () => {
		setIsMuted(!isMuted);
	};

	const handleClose = () => {
		useAudioPlayback.setState(useAudioPlayback.getInitialState());
	};

	const handleNavigate = () => {
		navigate({ to: "/player/audio" });
	};

	// Listen to play/pause events directly from audio element to keep state in sync
	// (e.g. if paused by media keys)
	const onPlay = () => {
		setPlaying(true);
		updatePositionState();
		if ("mediaSession" in navigator) {
			navigator.mediaSession.playbackState = "playing";
		}
	};
	const onPause = () => {
		setPlaying(false);
		updatePositionState();
		if ("mediaSession" in navigator) {
			navigator.mediaSession.playbackState = "paused";
		}
	};

	return (
		<AnimatePresence mode="sync">
			{display && (
				<motion.div
					initial={{ transform: "translate(-50%, 150%)" }}
					animate={{
						transform:
							location.pathname === "/player/audio"
								? "translate(-50%, 150%)"
								: "translate(-50%, 0%)",
					}}
					exit={{ transform: "translate(-50%, 150%)" }}
					transition={{ duration: 0.3, ease: "circOut" }}
					className="audio-player glass"
				>
					<PlayerInfo
						item={item}
						api={api}
						trackName={tracks?.[currentTrack]?.Name}
					/>

					<audio
						autoPlay
						src={url}
						ref={audioRef}
						key={item?.Id ?? "noItem"}
						onTimeUpdate={handleTimeUpdate}
						onEnded={handleEnded}
						onPlay={onPlay}
						onPause={onPause}
						onSeeked={updatePositionState}
						onLoadedMetadata={updatePositionState}
						id="audio-player"
					/>

					<div className="audio-player-controls">
						<PlayerControls playing={playing} onPlayPause={handlePlayPause} />
						<PlayerProgress
							progress={progress}
							duration={item?.RunTimeTicks ?? 1}
							onSeekCommit={handleSeekCommit}
						/>
					</div>

					<PlayerActions onNavigate={handleNavigate} onClose={handleClose}>
						<PlayerVolume
							volume={volume}
							isMuted={isMuted}
							onVolumeChange={handleVolumeChange}
							onMuteToggle={handleMuteToggle}
						/>
					</PlayerActions>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default AudioPlayer;
