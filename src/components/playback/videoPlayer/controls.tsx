import { getPlaystateApi } from "@jellyfin/sdk/lib/utils/api/playstate-api";
import { IconButton, Slider, Typography } from "@mui/material";
import { WebviewWindow as appWindow } from "@tauri-apps/api/webviewWindow";
import { AnimatePresence, motion } from "motion/react";
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
import { secToTicks } from "@/utils/date/time";
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
import EndsAtDisplay from "./EndsAtDisplay";
import VideoPlayerSettingsMenu from "./settingsMenu";

import "./controls.scss";
import { clearQueue } from "@/utils/store/queue";
import ProgressDisplay from "./ProgressDisplay";

/**
 * Constant for the volume change interval when using the mouse wheel.
 * This value determines how much the volume will change with each scroll step.
 */
const VOLUME_SCROLL_INTERVAL = 0.02;

type VideoPlayerControlsProps = {
	// isVisible: boolean;
	onHover?: (event: MouseEvent<HTMLDivElement>) => void;
	onLeave?: (event: MouseEvent<HTMLDivElement>) => void;
};

const VideoPlayerControls = ({
	// isVisible,
	onHover,
	onLeave,
}: VideoPlayerControlsProps) => {
	const playerOSDRef = useRef<HTMLDivElement>(null);

	const api = useApiInContext((state) => state.api);
	const {
		mediaSourceId,
		itemId,
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
		setVolume,
		toggleIsPlayerMuted,
		increaseVolumeByStep,
		decreaseVolumeByStep,
		getCurrentTime,
		isUserHovering,
	} = usePlaybackStore(
		useShallow((state) => ({
			mediaSourceId: state.mediaSource.id,
			itemChapters: state.metadata.item.Chapters,
			itemId: state.metadata.item.Id,
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
			setVolume: state.setVolume,
			toggleIsPlayerMuted: state.toggleIsPlayerMuted,
			increaseVolumeByStep: state.increaseVolumeByStep,
			decreaseVolumeByStep: state.decreaseVolumeByStep,
			getCurrentTime: state.getCurrentTime,
			isUserHovering: state.playerState.isUserHovering,
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
	const [showVolumeControl, setShowVolumeControl] = useState(false);

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
				isUserHovering || isUserSeeking || !isPlayerPlaying
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
				opacity: isUserHovering || isUserSeeking || !isPlayerPlaying ? 1 : 0,
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
						<ProgressDisplay />
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

							<EndsAtDisplay />
						</div>
						<div
							className="video-player-osd-controls-buttons"
							onMouseLeave={() => setShowVolumeControl(false)}
						>
							<AnimatePresence>
								{showVolumeControl && (
									<motion.div
										initial={{ width: 0, opacity: 0, marginRight: 0 }}
										animate={{ width: 100, opacity: 1, marginRight: 10 }}
										exit={{ width: 0, opacity: 0, marginRight: 0 }}
										style={{
											overflow: "hidden",
											display: "flex",
											alignItems: "center",
										}}
									>
										<Slider
											size="small"
											value={isPlayerMuted ? 0 : volume}
											max={1}
											step={0.01}
											onChange={(_, newValue) => {
												const val = Array.isArray(newValue)
													? newValue[0]
													: newValue;
												setVolume(val);
											}}
											sx={{ width: 100, color: "white" }}
										/>
									</motion.div>
								)}
							</AnimatePresence>
							<IconButton
								onClick={toggleIsPlayerMuted}
								onMouseEnter={() => setShowVolumeControl(true)}
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
