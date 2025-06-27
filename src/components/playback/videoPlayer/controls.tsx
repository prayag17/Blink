import { getPlaystateApi } from "@jellyfin/sdk/lib/utils/api/playstate-api";
import { IconButton, Typography } from "@mui/material";
import { WebviewWindow as appWindow } from "@tauri-apps/api/webviewWindow";
import { motion } from "motion/react";
import React, {
	type MouseEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { useShallow } from "zustand/shallow";
import PlayNextButton from "@/components/buttons/playNextButton";
import PlayPreviousButton from "@/components/buttons/playPreviousButtom";
import QueueButton from "@/components/buttons/queueButton";
import BubbleSlider from "@/components/playback/videoPlayer/bubbleSlider";
import { endsAt, secToTicks } from "@/utils/date/time";
import { useApiInContext } from "@/utils/store/api";
import { usePlaybackStore } from "@/utils/store/playback";
import CaptionsButton from "./buttons/CaptionsButton";
import ChaptersListButton from "./buttons/ChaptersListButton";
import ForwardButton from "./buttons/ForwardButton";
import FullscreenButton from "./buttons/FullscreenButton";
import NextChapterButton from "./buttons/NextChapterButton";
import PlayPauseButton from "./buttons/PlayPauseButton";
import PrevChapterButton from "./buttons/PrevChapterButton";
import RewindButton from "./buttons/RewindButton";
import VideoPlayerSettingsMenu from "./settingsMenu";

import "./controls.scss";
import { clearQueue } from "@/utils/store/queue";
import ProgressDislay from "./ProgressDisplay";

/**
 * Constant for the volume change interval when using the mouse wheel.
 * This value determines how much the volume will change with each scroll step.
 */
const VOLUME_SCROLL_INTERVAL = 0.02;

type VideoPlayerControlsProps = {
	isVisible: boolean;
	onHover?: (event: MouseEvent<HTMLDivElement>) => void;
	onLeave?: (event: MouseEvent<HTMLDivElement>) => void;
};

const VideoPlayerControls = ({
	isVisible,
	onHover,
	onLeave,
}: VideoPlayerControlsProps) => {
	const playerOSDRef = useRef<HTMLDivElement>(null);

	const api = useApiInContext((state) => state.api);
	const {
		mediaSourceId,
		itemId,
		itemDuration,
		itemName,
		episodeTitle,
		playsessionId,
		isPlayerPlaying,
		toggleIsPlaying,
		toggleIsPlayerFullscreen,
		isUserSeeking,
		// seekValue,
		isPlayerMuted,
		volume,
		toggleIsPlayerMuted,
		increaseVolumeByStep,
		decreaseVolumeByStep,
		getCurrentTime,
	} = usePlaybackStore(
		useShallow((state) => ({
			mediaSourceId: state.mediaSource.id,
			itemChapters: state.metadata.item.Chapters,
			itemId: state.metadata.item.Id,
			itemDuration: state.metadata.itemDuration,
			itemName: state.metadata.itemName,
			episodeTitle: state.metadata.episodeTitle,
			// mediaSegments: state.metadata.mediaSegments,
			isPlayerPlaying: state.playerState.isPlayerPlaying,
			playsessionId: state.playsessionId,
			toggleIsPlaying: state.toggleIsPlaying,
			toggleIsPlayerFullscreen: state.toggleIsPlayerFullscreen,
			isUserSeeking: state.playerState.isUserSeeking,
			seekValue: state.playerState.seekValue,
			isPlayerMuted: state.playerState.isPlayerMuted,
			volume: state.playerState.volume,
			toggleIsPlayerMuted: state.toggleIsPlayerMuted,
			increaseVolumeByStep: state.increaseVolumeByStep,
			decreaseVolumeByStep: state.decreaseVolumeByStep,
			getCurrentTime: state.getCurrentTime,
		})),
	);

	// Volume control with mouse wheel
	useEffect(() => {
		const handleMouseWheel = (event: WheelEvent) => {
			if (event.deltaY < 0) {
				increaseVolumeByStep(VOLUME_SCROLL_INTERVAL);
			} else if (event.deltaY > 0) {
				decreaseVolumeByStep(VOLUME_SCROLL_INTERVAL);
			}
		};

		const currentRef = playerOSDRef.current;
		// attach the event listener
		currentRef?.addEventListener("wheel", handleMouseWheel);

		// remove the event listener
		return () => {
			currentRef?.removeEventListener("wheel", handleMouseWheel);
		};
	}, [increaseVolumeByStep, decreaseVolumeByStep]);

	const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);

	const [settingsMenuRef, setSettingsMenuRef] =
		useState<HTMLButtonElement | null>(null);

	// const creditInfo = mediaSegments?.Items?.find(
	// 	(segment) => segment.Type === "Outro",
	// );

	// Credits and Next Episode Card
	// const [forceShowCredits, setForceShowCredits] = useState(false);
	// const showUpNextCard = useMemo(() => {
	// 	if (queue?.[currentQueueItemIndex]?.Id === queue?.[queue.length - 1]?.Id) {
	// 		return false; // Check if the current playing episode is last episode in queue
	// 	}
	// 	if (creditInfo) {
	// 		if (
	// 			currentTime >= (creditInfo.StartTicks ?? currentTime + 1) &&
	// 			currentTime < (creditInfo.EndTicks ?? 0)
	// 		)
	// 			return true;
	// 	}
	// 	if (
	// 		Math.ceil(ticksToSec(itemDuration) - ticksToSec(currentTime)) <= 30 &&
	// 		Math.ceil(ticksToSec(itemDuration) - ticksToSec(currentTime)) > 0
	// 	) {
	// 		return true;
	// 	}
	// 	return false;
	// }, [currentTime, creditInfo, itemDuration, queue, currentQueueItemIndex]);

	const handleExitPlayer = useCallback(async () => {
		appWindow.getCurrent().setFullscreen(false);

		history.back();
		if (!api) {
			throw Error("API is not available, cannot report playback stopped.");
		}
		// Report Jellyfin server: Playback has ended/stopped
		getPlaystateApi(api).reportPlaybackStopped({
			playbackStopInfo: {
				Failed: false,
				ItemId: itemId,
				MediaSourceId: mediaSourceId,
				PlaySessionId: playsessionId,
				PositionTicks: secToTicks(getCurrentTime() ?? 0),
			},
		});
		usePlaybackStore.setState(usePlaybackStore.getInitialState());
		clearQueue();
	}, [api, mediaSourceId, playsessionId, itemId]);

	return (
		<motion.div
			className={
				isVisible || isUserSeeking || !isPlayerPlaying
					? "video-player-osd hovering"
					: "video-player-osd"
			}
			onMouseEnter={onHover}
			onMouseLeave={onLeave}
			ref={playerOSDRef}
			initial={{
				opacity: 0,
			}}
			animate={{
				opacity: isVisible || isUserSeeking || !isPlayerPlaying ? 1 : 0,
			}}
			style={{
				zIndex: 2,
			}}
			onClick={(event) => {
				if (event.currentTarget !== event.target) {
					return;
				}

				if (event.detail === 1) {
					setClickTimeout(
						setTimeout(() => {
							toggleIsPlaying();
						}, 200),
					);
				} else if (event.detail === 2 && clickTimeout) {
					clearTimeout(clickTimeout);
					toggleIsPlayerFullscreen();
				}
			}}
		>
			<div className="video-player-osd-header flex flex-justify-spaced-between flex-align-center">
				<IconButton onClick={handleExitPlayer}>
					<span className="material-symbols-rounded">arrow_back</span>
				</IconButton>
				<IconButton onClick={(e) => setSettingsMenuRef(e.currentTarget)}>
					<span className="material-symbols-rounded">settings</span>
				</IconButton>
				<VideoPlayerSettingsMenu
					settingsMenuRef={settingsMenuRef}
					handleClose={() => setSettingsMenuRef(null)}
				/>
			</div>
			<div className="video-player-osd-info">
				<div>
					<Typography variant="h4" fontWeight={500} mb={2}>
						{String(itemName)}
					</Typography>
					{episodeTitle && (
						<Typography variant="h6" fontWeight={300} mt={1}>
							{String(episodeTitle)}
						</Typography>
					)}
				</div>
				<div className="video-player-osd-controls">
					<div className="video-player-osd-controls-timeline">
						<BubbleSlider />
						<ProgressDislay />
					</div>
					<div className="flex flex-row flex-justify-spaced-between">
						<div className="video-player-osd-controls-buttons">
							<PlayPreviousButton />
							<RewindButton />
							<PrevChapterButton />

							<PlayPauseButton />

							<NextChapterButton />

							<ForwardButton />
							<PlayNextButton />

							<Typography variant="subtitle1">
								{endsAt(itemDuration)}
							</Typography>
						</div>
						<div className="video-player-osd-controls-buttons">
							{/* <motion.div
									style={{
										width: "13em",
										padding: "0.5em 1.5em",
										paddingLeft: "0.8em",
										gap: "0.4em",
										background: "black",
										borderRadius: "100px",
										display: "grid",
										justifyContent: "center",
										alignItems: "center",
										gridTemplateColumns: "2em 1fr",
										opacity: 0,
									}}
									animate={{
										opacity: showVolumeControl ? 1 : 0,
									}}
									whileHover={{
										opacity: 1,
									}}
									onMouseLeave={() => setShowVolumeControl(false)}
								>
									<Typography textAlign="center">
										{isPlayerMuted ? 0 : Math.round(playerVolume * 100)}
									</Typography>
									<Slider
										step={0.01}
										max={1}
										size="small"
										value={isPlayerMuted ? 0 : playerVolume}
										onChange={async (_, newValue) => {
											if (api && Array.isArray(newValue)) {
												dispatch({
													type: VideoPlayerActionKind.SET_PLAYER_VOLUME,
													payload: newValue[0],
												});
											} else {
												dispatch({
													type: VideoPlayerActionKind.SET_PLAYER_VOLUME,
													payload: newValue,
												});
											}
											if (newValue === 0)
												dispatch({
													type: VideoPlayerActionKind.SET_PLAYER_MUTED,
													payload: true,
												});
											else
												dispatch({
													type: VideoPlayerActionKind.SET_PLAYER_MUTED,
													payload: true,
												});
										}}
									/>
								</motion.div> */}
							{/* TODO: Volume menu */}
							<IconButton
								onClick={toggleIsPlayerMuted}
								// onMouseMoveCapture={() => {
								// 	setShowVolumeControl(true);
								// }}
							>
								<span className="material-symbols-rounded">
									{isPlayerMuted
										? "volume_off"
										: volume < 0.4
											? "volume_down"
											: "volume_up"}
								</span>
							</IconButton>
							<QueueButton />

							<ChaptersListButton />

							<CaptionsButton />
							<FullscreenButton />
						</div>
					</div>
				</div>
			</div>
		</motion.div>
	);
};

export default VideoPlayerControls;
