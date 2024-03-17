import type { BaseItemDto, MediaStream } from "@jellyfin/sdk/lib/generated-client";
import { create } from "zustand";
import { setQueue, setTrackIndex } from "./queue";

// export interface PlaybackState {
// 	url: string;
// 	startPosition: number;
// 	duration: number;
// 	itemId: string;
// 	itemName: string | Element;
// 	subtitleTracks: unknown[];
// 	selectedSubtitleTrack: number;
// 	mediaSourceId: string;
// 	audioStreamIndex: number;
// 	videoStreamIndex: number;
// 	subtitleStreamIndex: number;
// 	userId: string;
// 	mediaContainer: string;
// 	seriesId: string;
// 	queue: unknown[];
// 	episodeIndex: number;
// 	item: BaseItemDto;
// 	setUrl: (aurl: string) => void;
// 	setPosition: (apos: number) => void;
// 	setDuration: (adur: number) => void;
// 	setItemId: (aid: string) => void;
// 	setItemName: (anm: string | Element) => void;
// 	setUserId: (anm: string) => void;
// 	setSeriesId: (anm: string) => void;
// 	setMediaContainer: (anm: string) => void;
// 	setMediaSourceId: (anm: string) => void;
// 	setAudioStreamIndex: (anm: number) => void;
// 	setVideoStreamIndex: (anm: number) => void;
// 	setSubtitleStreamIndex: (anm: number) => void;
// 	setSubtitleTracks: (asub: unknown[]) => void;
// 	setSelectedSubtitleTrack: (asub: number) => void;
// 	setQueue: (qitem: unknown[]) => void;
// 	setEpisodeIndex: (aitem: number) => void;
// }

// export const usePlaybackStore = create<PlaybackState>((set) => ({
// 	url: "",
// 	startPosition: 0,
// 	duration: 0,
// 	itemId: "",
// 	itemName: "",
// 	subtitleTracks: [],
// 	selectedSubtitleTrack: 0,
// 	mediaSourceId: "",
// 	audioStreamIndex: 0,
// 	videoStreamIndex: 0,
// 	subtitleStreamIndex: 0,
// 	userId: "",
// 	mediaContainer: "",
// 	seriesId: "",
// 	queue: [],
// 	episodeIndex: 0,

// 	item: {} as BaseItemDto,
// 	setUrl: (aurl: string) =>
// 		set((state: PlaybackState) => ({ ...state, url: aurl })),
// 	setPosition: (apos: number) =>
// 		set((state: PlaybackState) => ({ ...state, startPosition: apos })),
// 	setDuration: (adur: number) =>
// 		set((state: PlaybackState) => ({ ...state, duration: adur })),
// 	setItemId: (aid: string) =>
// 		set((state: PlaybackState) => ({ ...state, itemId: aid })),
// 	setItemName: (anm: string | Element) =>
// 		set((state: PlaybackState) => ({ ...state, itemName: anm })),
// 	setUserId: (anm: string) =>
// 		set((state: PlaybackState) => ({ ...state, userId: anm })),
// 	setSeriesId: (anm: string) =>
// 		set((state: PlaybackState) => ({ ...state, seriesId: anm })),
// 	setMediaContainer: (anm: string) =>
// 		set((state: PlaybackState) => ({ ...state, mediaContainer: anm })),
// 	setMediaSourceId: (anm: string) =>
// 		set((state: PlaybackState) => ({ ...state, mediaSourceId: anm })),
// 	setAudioStreamIndex: (anm: number) =>
// 		set((state: PlaybackState) => ({ ...state, audioStreamIndex: anm })),
// 	setVideoStreamIndex: (anm: number) =>
// 		set((state: PlaybackState) => ({ ...state, videoStreamIndex: anm })),
// 	setSubtitleStreamIndex: (anm: number) =>
// 		set((state: PlaybackState) => ({ ...state, subtitleStreamIndex: anm })),
// 	setSubtitleTracks: (asub: unknown[]) =>
// 		set((state: PlaybackState) => ({
// 			...state,
// 			subtitleTracks: asub,
// 		})),
// 	setSelectedSubtitleTrack: (asub: number) =>
// 		set((state: PlaybackState) => ({
// 			...state,
// 			selectedSubtitleTrack: asub,
// 		})),
// 	setQueue: (qitem: unknown[]) =>
// 		set((state: PlaybackState) => ({ ...state, queue: qitem })),
// 	setEpisodeIndex: (aitem: number) =>
// 		set((state: PlaybackState) => ({ ...state, episodeIndex: aitem })),
// }));

// export const setItem = (item: BaseItemDto) =>
// 	usePlaybackStore.setState((state: PlaybackState) => ({
// 		...state,
// 		item: item,
// 	}));

type PlaybackStore = {
	itemName: string | React.Component;
	episodeTitle: string | React.Component;
	mediaSource: {
		videoTrack: number;
		audioTrack: number;
		subtitleTrack: number;
		container: string;
		availableSubtitleTracks: MediaStream[];
		id: string | undefined;
	};
	enableSubtitle: boolean;
	hlsStream: string;
	userId: string;
	startPosition: number;
	itemDuration: number;
	item: BaseItemDto | null;
};

export const usePlaybackStore = create<PlaybackStore>(() => ({
	itemName: "",
	episodeTitle: "",
	mediaSource: {
		videoTrack: 0,
		audioTrack: 0,
		subtitleTrack: 0,
		container: "",
		availableSubtitleTracks: [],
		id: undefined
	},
	enableSubtitle: true,
	hlsStream: "",
	userId: "",
	startPosition: 0,
	itemDuration: 0,
	item: null,
}));

export const playItem = (
	itemName,
	episodeTitle,
	videoTrack,
	audioTrack,
	subtitleTrack,
	container,
	enableSubtitle,
	hlsStream,
	userId,
	startPosition,
	itemDuration,
	item,
	queue,
	queueItemIndex,
	availableSubtitleTracks,
	mediaSourceId
) => {
	usePlaybackStore.setState({
		itemName,
		episodeTitle,
		mediaSource: {
			videoTrack,
			audioTrack,
			subtitleTrack,
			container,
			availableSubtitleTracks,
			id: mediaSourceId,
		},
		enableSubtitle,
		hlsStream,
		userId,
		startPosition,
		itemDuration,
		item,
	});
	setQueue(queue, queueItemIndex);
};

interface PlaybackDataLoadState {
	isPending: boolean;
	setisPending: (loading: boolean) => void;
}

export const usePlaybackDataLoadStore = create<PlaybackDataLoadState>(
	(set) => ({
		isPending: false,
		setisPending: (loading: boolean) =>
			set((state: PlaybackDataLoadState) => ({
				...state,
				isPending: loading,
			})),
	}),
);
