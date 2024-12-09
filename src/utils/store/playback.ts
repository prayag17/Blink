import type { Api } from "@jellyfin/sdk";
import type {
	BaseItemDto,
	MediaSegmentDtoQueryResult,
	MediaStream,
} from "@jellyfin/sdk/lib/generated-client";
import { getMediaInfoApi } from "@jellyfin/sdk/lib/utils/api/media-info-api";
import { getMediaSegmentsApi } from "@jellyfin/sdk/lib/utils/api/media-segments-api";
import { getPlaystateApi } from "@jellyfin/sdk/lib/utils/api/playstate-api";
import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";
import getSubtitle from "../methods/getSubtitles";
import playbackProfile from "../playback-profiles";
import type audioPlaybackInfo from "../types/audioPlaybackInfo";
import type subtitlePlaybackInfo from "../types/subtitlePlaybackInfo";
import { generateAudioStreamUrl, playAudio } from "./audioPlayback";
import useQueue, { setQueue } from "./queue";

type PlaybackStore = {
	itemName: string | React.Component | undefined | null;
	episodeTitle: string | React.Component;
	mediaSource: {
		videoTrack: number;
		audioTrack: number;
		container: string;
		id: string | undefined;
		subtitle: subtitlePlaybackInfo;
		audio: audioPlaybackInfo;
	};
	playbackStream: string;
	userId: string;
	startPosition: number;
	itemDuration: number;
	item: BaseItemDto | null;
	playsessionId: string | undefined | null;
	intro: MediaSegmentDtoQueryResult | undefined;
};

export const usePlaybackStore = createWithEqualityFn<PlaybackStore>(
	() => ({
		itemName: undefined!,
		episodeTitle: "",
		mediaSource: {
			videoTrack: 0,
			audioTrack: 0,
			container: "",
			id: undefined,
			subtitle: {
				enable: false,
				track: undefined!,
				format: "ass",
				allTracks: undefined,
				url: undefined,
			},
			audio: {
				track: undefined!,
				allTracks: undefined,
			},
		},
		enableSubtitle: true,
		playbackStream: "",
		userId: "",
		startPosition: 0,
		itemDuration: 0,
		item: null,
		playsessionId: "",
		intro: undefined,
	}),
	shallow,
);

export const playItem = (
	itemName: string | React.Component | undefined | null,
	episodeTitle: string,
	videoTrack: number,
	audioTrack: number,
	container: string,
	playbackStream: string,
	userId: string,
	startPosition: number | undefined | null,
	itemDuration: number | undefined | null,
	item: BaseItemDto,
	queue: BaseItemDto[] | undefined | null,
	queueItemIndex: number,
	mediaSourceId: string | undefined | null,
	playsessionId: string | undefined | null,
	subtitle: subtitlePlaybackInfo | undefined,
	intro: MediaSegmentDtoQueryResult | undefined,
	audio: audioPlaybackInfo,
) => {
	console.log({
		itemName,
		episodeTitle,
		mediaSource: {
			videoTrack,
			audioTrack,
			container,
			id: mediaSourceId,
			subtitle,
			audio,
		},
		playbackStream,
		userId,
		startPosition,
		itemDuration,
		item,
		playsessionId,
		intro,
	});

	if (!queue) {
		throw new Error("No queue found");
	}

	if (!mediaSourceId) {
		throw new Error("No media source id found");
	}

	if (!subtitle) {
		throw new Error("No subtitle config found");
	}

	usePlaybackStore.setState({
		itemName,
		episodeTitle,
		mediaSource: {
			videoTrack,
			audioTrack,
			container,
			id: mediaSourceId,
			subtitle,
			audio,
		},
		playbackStream,
		userId,
		startPosition: startPosition ?? 0,
		itemDuration: itemDuration ?? 0,
		item,
		playsessionId,
		intro,
	});
	setQueue(queue, queueItemIndex);
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
		let itemName = item.Name;
		let episodeTitle = "";
		if (item.SeriesId) {
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
			//@ts-ignore
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

		const introInfo = (
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

		playItem(
			itemName,
			episodeTitle,
			videoTrack?.[0].Index ?? 0,
			mediaSource.MediaSources?.[0].DefaultAudioStreamIndex ?? 0,
			mediaSource?.MediaSources?.[0].Container ?? "mkv",
			playbackUrl,
			userId,
			item.UserData?.PlaybackPositionTicks,
			item.RunTimeTicks,
			item,
			queueItems,
			requestedItemIndex,
			mediaSource.MediaSources?.[0]?.Id,
			mediaSource.PlaySessionId,
			subtitle,
			introInfo,
			audio,
		);
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
export const changeAudioTrack = async (
	trackIndex: number,
	api: Api,
	startPosition: number,
) => {
	const prevState = usePlaybackStore.getState();
	if (!prevState.item?.Id) {
		throw new Error("item is undefined in changeAudioTrack");
	}
	if (!prevState.item.MediaSources?.[0].Id) {
		throw new Error("Media source id is undefined in changeAudioTrack");
	}
	const mediaSource = (
		await getMediaInfoApi(api).getPostedPlaybackInfo({
			audioStreamIndex: trackIndex,
			subtitleStreamIndex: prevState.mediaSource.subtitle.track,
			itemId: prevState.item.Id,
			startTimeTicks: prevState.item.UserData?.PlaybackPositionTicks,
			userId: prevState.userId,
			mediaSourceId: prevState.item.MediaSources?.[0].Id,
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
		//@ts-ignore
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
	prevState.startPosition = startPosition;
	prevState.playsessionId = mediaSource.PlaySessionId;

	usePlaybackStore.setState(prevState);
	// const currentItemIndex = useQueue.getState().currentItemIndex;
	// playItemFromQueue(currentItemIndex, prevState.userId, api);
};