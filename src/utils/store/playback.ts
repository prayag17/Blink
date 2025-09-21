import type { Api } from "@jellyfin/sdk";
import type {
	BaseItemDto,
	MediaSegmentDtoQueryResult,
	MediaStream,
} from "@jellyfin/sdk/lib/generated-client";
import { getMediaInfoApi } from "@jellyfin/sdk/lib/utils/api/media-info-api";
import { getMediaSegmentsApi } from "@jellyfin/sdk/lib/utils/api/media-segments-api";
import { getPlaystateApi } from "@jellyfin/sdk/lib/utils/api/playstate-api";
import { WebviewWindow as appWindow } from "@tauri-apps/api/webviewWindow";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";
import { secToTicks, ticksToSec } from "../date/time";
import getSubtitle from "../methods/getSubtitles";
import playbackProfile from "../playback-profiles";
import type audioPlaybackInfo from "../types/audioPlaybackInfo";
import type subtitlePlaybackInfo from "../types/subtitlePlaybackInfo";
import { generateAudioStreamUrl, playAudio } from "./audioPlayback";
import useQueue, { setQueue } from "./queue";

type PlaybackStoreState = {
	mediaSource: {
		videoTrack: number;
		audioTrack: number;
		container: string;
		id: string | undefined;
		subtitle: subtitlePlaybackInfo;
		audio: audioPlaybackInfo;
	};
	playbackStream: string;
	playsessionId: string | undefined | null;
	metadata: {
		itemName: string;
		episodeTitle?: string;
		isEpisode: boolean;
		/**
		 * Duration of the item in C# ticks
		 * This is used to calculate the progress bar and the total duration of the item
		 */
		itemDuration: number;
		item: BaseItemDto;
		mediaSegments?: MediaSegmentDtoQueryResult;
		userDataLastPlayedPositionTicks?: number;
	};
	playerState: {
		/**
		 * Persistent volume level between player instances
		 */
		volume: number;
		/**
		 * Prop for ReactPlayer to mute and unmute audio volume regardless of the volume value
		 */
		isPlayerMuted: boolean;
		isPlayerPlaying: boolean;
		/**
		 * Used to check if ReactPlayer component has finished initial fetch of playbackStream
		 * true -> Player is ready for playback
		 * false -> Player is not ready for playback/is still fetching data/possible error while fetching
		 */
		isPlayerReady: boolean;
		isBuffering: boolean;
		/**
		 * Current playback time in C# ticks
		 * This is used to update the playback time in the UI
		 * Initially should be set to UserData.PlaybackPositionTicks in seconds
		 * Source: ReactPlayer's onProgress event
		 * */
		currentTime: number;
		/**
		 * Used to toggle the fullscreen state of the player
		 * This is used to toggle the fullscreen state of the player
		 * This should be set to true when the user clicks on the fullscreen button
		 */
		isPlayerFullscreen: boolean;
		/**
		 * Used to see if user is seeking/scrubbing progress bar
		 * Used to temporarily switch to seek progress for the progress bar
		 */
		isUserSeeking: boolean;
		/**
		 * Seek value
		 * This value should be in C# ticks
		 */
		seekValue: number;
		/**
		 * Used to display controls/see if user is hovering the media player
		 */
		isUserHovering: boolean;
		/**
		 * Used to show the buffering spinner in the UI
		 * This should be set to true when the player is buffering
		 */
		isLoading: boolean;
		/**
		 * Used to track if Picture-in-Picture mode is active
		 * This should be set to true when the video is in PiP mode
		 */
		isPictureInPicture: boolean;
		/**
		 * Used to check if Picture-in-Picture is supported by the browser
		 * This should be set to true if the browser supports PiP API
		 */
		isPictureInPictureSupported: boolean;
	};
	/**
	 * Index of the next segment to be played
	 */
	nextSegmentIndex: number;
	/**
	 * Id of the active segment
	 * Set if null if no segment is active
	 */
	activeSegmentId: string | null;
	/**
	 * User id of the user who is currently playing the item
	 */
	userId: string;
	/**
	 * Volume change indicator
	 * This is used to show the volume change indicator in the UI
	 */
	isVolumeInidcatorVisible: boolean;
	volumeIndicatorVisibleTimeoutId: NodeJS.Timeout | null;
};

type PlaybackStoreActions = {
	// Player state related actions
	/**
	 * Set the volume of the player
	 * This is used to set the volume of the player
	 * This should be set to a value between 0 and 1
	 */
	setVolume: (volume: number) => void;
	/**
	 * Increase the volume of the player by a step
	 * This is used to increase the volume of the player by a step
	 * This should be set to a value between 0 and 1
	 */
	increaseVolumeByStep: (step: number) => void;
	/**
	 * Decrease the volume of the player by a step
	 * This is used to decrease the volume of the player by a step
	 * This should be set to a value between 0 and 1
	 */
	decreaseVolumeByStep: (step: number) => void;
	/**
	 * Toggle the player state between playing and paused
	 * This is used to toggle the player state
	 */
	toggleIsPlaying: () => void;
	/**
	 * Set the player state to playing
	 */
	setIsPlaying: (isPlaying: boolean) => void;
	/**
	 * Set the player state to buffering
	 * This is used to show the buffering spinner in the UI
	 * This should be set to true when the player is buffering
	 */
	setIsBuffering: (isBuffering: boolean) => void;
	/**
	 * Set the current time of the player
	 */
	setCurrentTime: (currentTime: number) => void;
	/**
	 * Set the player state to ready
	 * This is used to check if the player is ready for playback
	 * This should be set to true when the player has finished fetching the playback stream
	 */
	setPlayerReady: (isPlayerReady: boolean) => void;
	/**
	 * Toggle the player state to fullscreen
	 * This is used to toggle the fullscreen state of the player
	 * This should be set to true when the user clicks on the fullscreen button
	 */
	toggleIsPlayerFullscreen: () => void;
	/**
	 * Set the user hover state
	 * This is used to show/hide the player controls
	 * This should be set to true when the user hovers over the player
	 * This should be set to false when the user stops hovering over the player
	 */
	setIsUserHovering: (isUserHovering: boolean) => void;
	/**
	 * Set the user seeking state
	 * This is used to temporarily switch to seek progress for the progress bar
	 * This should be set to true when the user is seeking/scrubbing the progress bar
	 */
	setIsUserSeeking: (isUserSeeking: boolean) => void;
	/**
	 * Set the seek value
	 * This is used to update the seek value in the UI
	 * This should be set to the value of the progress bar when the user is seeking/scrubbing
	 * This value should be in C# ticks
	 */
	setSeekValue: (seekValue: number) => void;
	/**
	 * Toggle the player muted state
	 * This is used to toggle the player muted state
	 */
	toggleIsPlayerMuted: () => void;
	/**
	 * Toggle Picture-in-Picture mode
	 * This is used to enter/exit Picture-in-Picture mode
	 */
	togglePictureInPicture: () => void;
	/**
	 * Set Picture-in-Picture state
	 * This is used to update the PiP state when the browser PiP events occur
	 */
	setPictureInPicture: (isPictureInPicture: boolean) => void;
	/**
	 * Set Picture-in-Picture support
	 * This is used to check if the browser supports PiP
	 */
	setPictureInPictureSupported: (isSupported: boolean) => void;
	/**
	 * Set the loading state of the player
	 * This is used to show/hide the loading spinner in the UI
	 * This should be set to true when the player is loading
	 * This should be set to false when the player has finished loading
	 */
	setIsLoading: (isLoading: boolean) => void;
	setPlayerState: (playerState: PlaybackStoreState["playerState"]) => void;

	// Playback information related actions
	setMetadata: (
		itemName: string,
		episodeTitle: string,
		isEpisode: boolean,
		itemDuration: number,
		item: BaseItemDto,
		mediaSegments?: MediaSegmentDtoQueryResult,
		userDataLastPlayedPositionTicks?: number,
	) => void;
	setMediaSource: (
		videoTrack: number,
		audioTrack: number,
		container: string,
		id: string | undefined,
		subtitle: subtitlePlaybackInfo,
		audio: audioPlaybackInfo,
	) => void;
	setPlaybackStream: (playbackStream: string) => void;
	setPlaysessionId: (playsessionId: string | undefined | null) => void;
	setUserId: (userId: string) => void;
	setActiveSegment: (segmentIndex: number) => void;
	clearActiveSegment: () => void;

	/**
	 * Trigger volume change indicator
	 * This is used to show the volume change indicator in the UI
	 */
	tiggerVolumeIndicator: () => void;

	// ReactPlayer related actions
	_playerActions: {
		seekTo: (seconds: number) => void;
		getCurrentTime: () => number;
	};
	registerPlayerActions: (
		actions: PlaybackStoreActions["_playerActions"],
	) => void;
	seekTo: (seconds: number) => void;
	seekForward: (seconds: number) => void;
	seekBackward: (seconds: number) => void;
	getCurrentTime: () => number;
	seekToNextChapter: () => void;
	seekToPrevChapter: () => void;
	handleStartSeek: (ticks: number) => void;
	handleStopSeek: (ticks: number) => void;
	/**
	 * Skip current media segment
	 */
	skipSegment: () => void;
	handleOnSeek: (seconds: number) => void;
};

export const usePlaybackStore = create<
	PlaybackStoreState & PlaybackStoreActions
>()(
	immer((set, get) => ({
		mediaSource: {
			videoTrack: undefined!,
			audioTrack: undefined!,
			container: undefined!,
			id: undefined!,
			subtitle: undefined!,
			audio: undefined!,
		},
		playbackStream: undefined!,
		playsessionId: undefined!,
		metadata: {
			itemName: undefined!,
			episodeTitle: undefined,
			isEpisode: false,
			itemDuration: undefined!,
			item: undefined!,
			mediaSegments: undefined,
			userDataLastPlayedPositionTicks: 0,
		},
		playerState: {
			volume: 1,
			isPlayerMuted: false,
			isPlayerPlaying: true,
			isPlayerReady: false,
			isPlayerFullscreen: false,
			isUserHovering: false,
			isBuffering: true,
			currentTime: undefined!,
			isUserSeeking: false,
			seekValue: 0,
			isLoading: true,
			isPictureInPicture: false,
			isPictureInPictureSupported: false,
		},
		userId: undefined!,
		// -- MediaSegment skip feature --
		nextSegmentIndex: 0,
		activeSegmentId: null,

		// -- Volume change indicator --
		isVolumeInidcatorVisible: false,
		volumeIndicatorVisibleTimeoutId: null,

		// -- Player state related actions --
		setVolume: (volume) => {
			if (volume < 0 || volume > 1) {
				console.warn("Volume must be between 0 and 1");
			}
			set((state) => {
				state.playerState.volume = volume;
				state.playerState.isPlayerMuted = volume === 0; // Mute if volume is 0
			});
			get().tiggerVolumeIndicator(); // Trigger volume change indicator
		},
		increaseVolumeByStep: (step) => {
			set((state) => {
				state.playerState.volume = Math.min(
					1,
					Math.max(0, state.playerState.volume + step),
				);
			});
			get().tiggerVolumeIndicator(); // Trigger volume change indicator
		},
		decreaseVolumeByStep: (step) => {
			set((state) => {
				state.playerState.volume = Math.min(
					1,
					Math.max(0, state.playerState.volume - step),
				);
			});
			get().tiggerVolumeIndicator(); // Trigger volume change indicator
		},
		toggleIsPlaying: () => {
			set((state) => {
				state.playerState.isPlayerPlaying = !state.playerState.isPlayerPlaying;
			});
		},
		setIsPlaying: (isPlaying) =>
			set((state) => {
				state.playerState.isPlayerPlaying = isPlaying;
			}),
		setIsBuffering: (isBuffering) =>
			set((state) => {
				state.playerState.isBuffering = isBuffering;
			}),
		setCurrentTime: (ticks) => {
			const { nextSegmentIndex, activeSegmentId, metadata } = get();
			if (activeSegmentId) {
				const activeSegment = metadata.mediaSegments?.Items?.find(
					(s) => s.Id === activeSegmentId,
				);
				if (activeSegment && ticks > (activeSegment.EndTicks ?? ticks)) {
					// If the current time is past the active segment's end time, clear it.
					set((state) => {
						state.activeSegmentId = null;
					});
				}
			}

			if (nextSegmentIndex !== -1) {
				const nextSegment = metadata.mediaSegments?.Items?.[nextSegmentIndex];
				console.info("Next segment:", nextSegment);
				if (nextSegment && ticks >= (nextSegment.StartTicks ?? ticks + 1)) {
					// If the current time is past the next segment's start time, set it as active.
					// clearActiveSegment();
					set((state) => {
						state.activeSegmentId = null;
						state.nextSegmentIndex = nextSegmentIndex + 1;
						state.activeSegmentId = nextSegment?.Id ?? null;
					});
				}
			}

			set((state) => {
				state.playerState.currentTime = ticks;
			});
		},
		setPlayerReady: (isPlayerReady) =>
			set((state) => {
				state.playerState.isPlayerReady = isPlayerReady;
			}),
		setMetadata: (
			itemName: string,
			episodeTitle: string,
			isEpisode: boolean,
			itemDuration: number,
			item: BaseItemDto,
			mediaSegments?: MediaSegmentDtoQueryResult,
		) =>
			set((state) => {
				state.metadata.itemName = itemName;
				state.metadata.episodeTitle = episodeTitle;
				state.metadata.isEpisode = isEpisode;
				state.metadata.itemDuration = itemDuration;
				state.metadata.item = item;
				state.metadata.mediaSegments = mediaSegments;
			}),
		setMediaSource: (
			videoTrack: number,
			audioTrack: number,
			container: string,
			id: string | undefined,
			subtitle: subtitlePlaybackInfo,
			audio: audioPlaybackInfo,
		) =>
			set((state) => {
				state.mediaSource.videoTrack = videoTrack;
				state.mediaSource.audioTrack = audioTrack;
				state.mediaSource.container = container;
				state.mediaSource.id = id;
				state.mediaSource.subtitle = subtitle;
				state.mediaSource.audio = audio;
			}),
		setPlaybackStream: (playbackStream: string) =>
			set((state) => {
				state.playbackStream = playbackStream;
			}),
		setPlaysessionId: (playsessionId) =>
			set((state) => {
				state.playsessionId = playsessionId;
			}),
		toggleIsPlayerFullscreen: async () => {
			await appWindow
				.getCurrent()
				.setFullscreen(!get().playerState.isPlayerFullscreen);
			set((state) => {
				state.playerState.isPlayerFullscreen =
					!state.playerState.isPlayerFullscreen;
			});
		},
		setIsUserHovering: (isUserHovering) =>
			set((state) => {
				state.playerState.isUserHovering = isUserHovering;
			}),
		setIsUserSeeking: (isUserSeeking) =>
			set((state) => {
				state.playerState.isUserSeeking = isUserSeeking;
			}),
		setSeekValue: (seekValue) =>
			set((state) => {
				state.playerState.seekValue = seekValue;
			}),
		toggleIsPlayerMuted: () =>
			set((state) => {
				state.playerState.isPlayerMuted = !state.playerState.isPlayerMuted;
			}),
		togglePictureInPicture: () => {
			// This will be handled by the PiP utility functions
			// The actual PiP API calls will be made in the component
		},
		setPictureInPicture: (isPictureInPicture) =>
			set((state) => {
				state.playerState.isPictureInPicture = isPictureInPicture;
			}),
		setPictureInPictureSupported: (isSupported) =>
			set((state) => {
				state.playerState.isPictureInPictureSupported = isSupported;
			}),
		setIsLoading: (isLoading) =>
			set((state) => {
				state.playerState.isLoading = isLoading;
			}),
		setPlayerState: (playerState) =>
			set((state) => ({
				...state,
				playerState: {
					...state.playerState,
					...playerState,
				},
			})),
		setUserId: (userId) =>
			set(() => ({
				userId: userId,
			})),
		setActiveSegment: (segmentIndex) => {
			const segment = get().metadata.mediaSegments?.Items?.[segmentIndex];
			set((state) => {
				state.nextSegmentIndex = segmentIndex + 1;
				state.activeSegmentId = segment?.Id ?? null;
			});
		},
		clearActiveSegment: () => {
			set((state) => {
				state.activeSegmentId = null;
			});
		},

		// -- Volume change indicator Action --
		tiggerVolumeIndicator: () => {
			const timeoutId = get().volumeIndicatorVisibleTimeoutId;
			if (timeoutId) {
				clearTimeout(timeoutId); // Volume indicator is already visible
			}
			set((state) => {
				state.isVolumeInidcatorVisible = true;
				state.volumeIndicatorVisibleTimeoutId = setTimeout(() => {
					set((state) => {
						state.isVolumeInidcatorVisible = false;
					});
				}, 1000);
			});
		},

		// -- ReactPlayer related actions --
		_playerActions: {
			seekTo: (_seconds: number) =>
				console.warn(
					"ReactPlayer has not yet initialized. Please wait until the player is ready to seek.",
				),
			getCurrentTime: () => {
				console.warn(
					"ReactPlayer has not yet initialized. Please wait until the player is ready to get current time.",
				);
				return 0;
			},
		},
		registerPlayerActions: (actions) => {
			console.info("Registering player actions:", actions);
			set({
				_playerActions: actions,
			});
		},
		seekTo: (seconds: number) => {
			const playerActions = get()._playerActions;
			playerActions.seekTo(seconds);
		},
		seekForward: (seconds: number) => {
			const playerActions = get()._playerActions;
			const currentTime = playerActions.getCurrentTime();
			playerActions.seekTo(currentTime + seconds);
		},
		seekBackward: (seconds: number) => {
			const playerActions = get()._playerActions;
			const currentTime = playerActions.getCurrentTime();
			playerActions.seekTo(Math.max(0, currentTime - seconds));
		},
		getCurrentTime: () => {
			const playerActions = get()._playerActions;
			return playerActions.getCurrentTime();
		},
		seekToNextChapter: () => {
			const playerActions = get()._playerActions;
			const next = get().metadata.item?.Chapters?.filter((chapter) => {
				if (
					(chapter.StartPositionTicks ?? 0) > playerActions.getCurrentTime()
				) {
					return true;
				}
			})[0];
			playerActions.seekTo(ticksToSec(next?.StartPositionTicks ?? 0));
		},
		seekToPrevChapter: () => {
			const playerActions = get()._playerActions;
			const chapters = get().metadata.item.Chapters?.filter((chapter) => {
				if (
					(chapter.StartPositionTicks ?? 0) <=
					secToTicks(playerActions.getCurrentTime())
				) {
					return true;
				}
			});
			if (!chapters?.length) {
				playerActions.seekTo(0);
			}
			if (chapters?.length === 1) {
				playerActions.seekTo(ticksToSec(chapters[0].StartPositionTicks ?? 0));
			} else if ((chapters?.length ?? 0) > 1) {
				playerActions.seekTo(
					ticksToSec(chapters?.[chapters.length - 2].StartPositionTicks ?? 0),
				);
			}
		},
		skipSegment: () => {
			const activeSegmentId = get().activeSegmentId;
			const activeSegment = get().metadata.mediaSegments?.Items?.find(
				(s) => s.Id === activeSegmentId,
			);
			if (!activeSegment) {
				console.warn("No segment to skip");
				return;
			}
			console.info("Skipping segment:", activeSegment);
			get()._playerActions.seekTo(ticksToSec(activeSegment.EndTicks ?? 0));
		},
		handleStartSeek: (ticks) => {
			set((state) => {
				state.playerState.isUserSeeking = true;
				state.playerState.seekValue = ticks;
			});
		},
		handleStopSeek: (ticks) => {
			const playerActions = get()._playerActions;
			playerActions.seekTo(ticksToSec(ticks));
			// Update current time to the new seek value
			set((state) => {
				state.playerState.isUserSeeking = false;
				state.playerState.currentTime = ticks;
			});
		},
		handleOnSeek: (seconds) => {
			const ticks = secToTicks(seconds);
			const segments = get().metadata.mediaSegments?.Items;
			if (!segments || segments.length === 0) {
				console.warn("No segments available for seeking");
				return;
			}
			const segment = segments.find(
				(s) =>
					(s.StartTicks ?? ticks) <= ticks && (s.EndTicks ?? ticks) >= ticks,
			);
			const nextIndex = segments.findIndex(
				(s) => (s.StartTicks ?? ticks) > ticks,
			);
			if (segment?.Id) {
				// If the segment is found, set it as active
				set({
					activeSegmentId: segment.Id,
					nextSegmentIndex: nextIndex !== -1 ? nextIndex : segments.length,
				});
			} else {
				// If no segment is found, clear the active segment
				set({
					activeSegmentId: null,
					nextSegmentIndex: nextIndex !== -1 ? nextIndex : segments.length,
				});
			}
		},
	})),
);

export const playItem = (args: {
	mediaSource: PlaybackStoreState["mediaSource"];
	playbackStream: PlaybackStoreState["playbackStream"];
	playsessionId: PlaybackStoreState["playsessionId"];
	metadata: PlaybackStoreState["metadata"];
	userDataPlayedPositionTicks: number;
	userId: string;
	queueItems: BaseItemDto[];
	queueItemIndex: number;
}) => {
	usePlaybackStore.setState((state) => {
		state.mediaSource = args.mediaSource;
		state.playbackStream = args.playbackStream;
		state.playsessionId = args.playsessionId;
		state.metadata = args.metadata;
		state.playerState.currentTime = args.userDataPlayedPositionTicks;
		state.userId = args.userId;
		state.playerState.isPlayerPlaying = true;
		state.playerState.isPlayerReady = false; // Reset player ready state
	});

	setQueue(args.queueItems, args.queueItemIndex ?? 0);
};

export const playItemFromQueue = async (
	index: "next" | "previous" | number,
	userId: string | undefined,
	api: Api | undefined,
) => {
	if (!api) {
		console.error("Unable to play item from from queue. No API provided");
		return;
	}
	const queueItems = useQueue.getState().tracks;
	const currentItemIndex = useQueue.getState().currentItemIndex;
	const requestedItemIndex =
		index === "next"
			? currentItemIndex + 1
			: index === "previous"
				? currentItemIndex - 1
				: index;
	const prevItem = queueItems?.[currentItemIndex];
	const prevPlaySessionId = usePlaybackStore.getState().playsessionId;
	const prevMediaSourceId = usePlaybackStore.getState().mediaSource.id;
	const item = queueItems?.[requestedItemIndex];

	const prevMediaSource = usePlaybackStore.getState().mediaSource;

	console.log("requestedItemIndex", queueItems);

	if (!item?.Id) {
		console.error("No item found in queue");
		return;
	}
	if (item?.Type === "Audio" && userId) {
		const playbackUrl = generateAudioStreamUrl(
			item.Id,
			userId,
			api.deviceInfo.id,
			api.basePath,
			api.accessToken,
		);
		// console.log(item);
		playAudio(playbackUrl, item, undefined);
		setQueue(queueItems, requestedItemIndex);
	} else {
		if (!userId) {
			console.error("No user id provided");
			return;
		}
		if (!item.MediaSources?.[0]?.Id) {
			console.error("No media source id found");
			return;
		}
		if (!item) {
			throw new Error("Item is undefined in playItemFromQueue");
		}
		if (!item.Name) {
			throw new Error("Item name is undefined in playItemFromQueue");
		}
		if (!item.RunTimeTicks) {
			throw new Error("Item run time ticks is undefined in playItemFromQueue");
		}
		if (!item.Id) {
			throw new Error("Item id is undefined in playItemFromQueue");
		}

		const mediaSource = (
			await getMediaInfoApi(api).getPostedPlaybackInfo({
				audioStreamIndex:
					prevItem?.Id === item.Id
						? prevMediaSource.audio.track
						: (item.MediaSources?.[0]?.DefaultAudioStreamIndex ?? 0),
				subtitleStreamIndex:
					prevItem?.Id === item.Id
						? prevMediaSource.subtitle.track
						: (item?.MediaSources?.[0]?.DefaultSubtitleStreamIndex ?? -1),
				itemId: item.Id,
				startTimeTicks: item.UserData?.PlaybackPositionTicks,
				userId: userId,
				mediaSourceId: item.MediaSources?.[0].Id,
				playbackInfoDto: {
					DeviceProfile: playbackProfile,
				},
			})
		).data;
		if (!mediaSource.MediaSources?.[0]?.Id) {
			throw new Error("Media source is undefined in playItemFromQueue");
		}

		let itemName = item.Name;
		let episodeTitle = "";
		if (item.SeriesId && item.SeriesName) {
			itemName = item.SeriesName;
			episodeTitle = `S${item.ParentIndexNumber ?? 0}:E${
				item.IndexNumber ?? 0
			} ${item.Name}`;
		}

		// Subtitle
		const subtitle = getSubtitle(
			mediaSource.MediaSources?.[0].DefaultSubtitleStreamIndex ?? "nosub",
			mediaSource.MediaSources?.[0].MediaStreams,
		);

		console.log("subtitle", mediaSource);

		// Audio
		const audio = {
			track: mediaSource.MediaSources?.[0].DefaultAudioStreamIndex ?? 0,
			allTracks: mediaSource.MediaSources?.[0].MediaStreams?.filter(
				(value) => value.Type === "Audio",
			),
		};

		// URL generation
		const urlOptions: URLSearchParams = {
			//@ts-expect-error
			Static: true,
			tag: mediaSource.MediaSources?.[0].ETag,
			mediaSourceId: mediaSource.MediaSources?.[0].Id,
			deviceId: api?.deviceInfo.id,
			api_key: api?.accessToken,
		};
		const urlParams = new URLSearchParams(urlOptions).toString();
		let playbackUrl = `${api?.basePath}/Videos/${mediaSource.MediaSources?.[0].Id}/stream.${mediaSource.MediaSources?.[0].Container}?${urlParams}`;
		if (
			mediaSource.MediaSources?.[0].SupportsTranscoding &&
			mediaSource.MediaSources?.[0].TranscodingUrl
		) {
			playbackUrl = `${api.basePath}${mediaSource.MediaSources[0].TranscodingUrl}`;
		}

		const videoTrack = mediaSource.MediaSources?.[0].MediaStreams?.filter(
			(value) => value.Type === "Video",
		);

		const mediaSegments = (
			await getMediaSegmentsApi(api).getItemSegments({
				itemId: item.Id ?? "",
			})
		)?.data;

		// Report playback stop to jellyfin server for previous episode allowing next episode to report playback
		await getPlaystateApi(api).reportPlaybackStopped({
			playbackStopInfo: {
				Failed: false,
				ItemId: prevItem?.Id,
				MediaSourceId: prevMediaSourceId,
				PlaySessionId: prevPlaySessionId,
			},
		});

		playItem({
			metadata: {
				itemName,
				episodeTitle: episodeTitle,
				isEpisode: !!item.SeriesId,
				itemDuration: item.RunTimeTicks,
				item: item,
				mediaSegments: mediaSegments,
				userDataLastPlayedPositionTicks:
					item.UserData?.PlaybackPositionTicks ?? 0,
			},
			mediaSource: {
				videoTrack: videoTrack?.[0]?.Index ?? 0,
				audioTrack: audio.track,
				container: mediaSource.MediaSources?.[0].Container ?? "",
				id: mediaSource.MediaSources?.[0]?.Id,
				subtitle: {
					url: subtitle?.url,
					track: subtitle?.track ?? -1,
					format: subtitle?.format ?? "nosub",
					allTracks: mediaSource.MediaSources?.[0].MediaStreams?.filter(
						(value) => value.Type === "Subtitle",
					),
					enable: subtitle?.enable ?? false,
				},
				audio: audio,
			},
			playbackStream: playbackUrl,
			playsessionId: mediaSource.PlaySessionId,
			userDataPlayedPositionTicks: item.UserData?.PlaybackPositionTicks ?? 0,
			userId,
			queueItems: queueItems,
			queueItemIndex: requestedItemIndex,
		});
	}

	return "playing"; // Return any value to end mutation pending status
};

interface PlaybackDataLoadState {
	isPending: boolean;
	setisPending: (loading: boolean) => void;
}

export const usePlaybackDataLoadStore =
	createWithEqualityFn<PlaybackDataLoadState>(
		(set) => ({
			isPending: false,
			setisPending: (loading: boolean) =>
				set((state: PlaybackDataLoadState) => ({
					...state,
					isPending: loading,
				})),
		}),
		shallow,
	);

export const changeSubtitleTrack = (
	trackIndex: number,
	allTracks: MediaStream[],
) => {
	const requiredSubtitle = allTracks.filter(
		(track) => track.Index === trackIndex,
	);
	const prevState = usePlaybackStore.getState();
	prevState.mediaSource.subtitle = {
		url: requiredSubtitle?.[0]?.DeliveryUrl,
		track: trackIndex,
		format: requiredSubtitle?.[0]?.Codec,
		allTracks,
		enable: trackIndex !== -1,
	};
	usePlaybackStore.setState(prevState);
};

export const toggleSubtitleTrack = () => {
	const prevState = usePlaybackStore.getState();
	if (prevState.mediaSource.subtitle.track !== -1) {
		prevState.mediaSource.subtitle.enable =
			!prevState.mediaSource.subtitle.enable;
		usePlaybackStore.setState(prevState);
	}
};

/**
 *
 * @param trackIndex index of the new audio track
 * @param api api instance
 * @param startPosition position of videoPlayer during audio track change (this should be in ticks)
 */
export const changeAudioTrack = async (trackIndex: number, api: Api) => {
	const prevState = usePlaybackStore.getState();

	if (!prevState.metadata.item?.Id) {
		throw new Error("item is undefined in changeAudioTrack");
	}
	if (!prevState.metadata.item.MediaSources?.[0].Id) {
		throw new Error("Media source id is undefined in changeAudioTrack");
	}
	const mediaSource = (
		await getMediaInfoApi(api).getPostedPlaybackInfo({
			audioStreamIndex: trackIndex,
			subtitleStreamIndex: prevState.mediaSource.subtitle.track,
			itemId: prevState.metadata.item.Id,
			startTimeTicks: prevState.metadata.item.UserData?.PlaybackPositionTicks,
			userId: prevState.userId,
			mediaSourceId: prevState.metadata.item.MediaSources?.[0].Id,
			playbackInfoDto: {
				DeviceProfile: playbackProfile,
			},
		})
	).data;
	prevState.mediaSource.audio.track = trackIndex;
	prevState.mediaSource.id = mediaSource.MediaSources?.[0].Id ?? "";
	prevState.mediaSource.container =
		mediaSource.MediaSources?.[0].Container ?? "";

	// URL generation
	const urlOptions: URLSearchParams = {
		//@ts-expect-error
		Static: true,
		tag: mediaSource.MediaSources?.[0].ETag,
		mediaSourceId: mediaSource.MediaSources?.[0].Id,
		deviceId: api?.deviceInfo.id,
		api_key: api?.accessToken,
	};
	const urlParams = new URLSearchParams(urlOptions).toString();
	let playbackUrl = `${api?.basePath}/Videos/${mediaSource.MediaSources?.[0].Id}/stream.${mediaSource.MediaSources?.[0].Container}?${urlParams}`;
	if (
		mediaSource.MediaSources?.[0].SupportsTranscoding &&
		mediaSource.MediaSources?.[0].TranscodingUrl
	) {
		playbackUrl = `${api.basePath}${mediaSource.MediaSources[0].TranscodingUrl}`;
	}

	prevState.playbackStream = playbackUrl;
	// prevState.item = startPosition;
	prevState.playsessionId = mediaSource.PlaySessionId;

	usePlaybackStore.setState(prevState);
	// const currentItemIndex = useQueue.getState().currentItemIndex;
	// playItemFromQueue(currentItemIndex, prevState.userId, api);
};