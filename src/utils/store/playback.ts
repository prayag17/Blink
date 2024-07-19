import type { Api } from "@jellyfin/sdk";
import type {
	BaseItemDto,
	MediaStream,
} from "@jellyfin/sdk/lib/generated-client";
import { getMediaInfoApi } from "@jellyfin/sdk/lib/utils/api/media-info-api";
import { getPlaystateApi } from "@jellyfin/sdk/lib/utils/api/playstate-api";
import type { AxiosResponse } from "axios";
import { create } from "zustand";
import getSubtitle from "../methods/getSubtitles";
import playbackProfile from "../playback-profiles";
import type IntroMediaInfo from "../types/introMediaInfo";
import type subtitlePlaybackInfo from "../types/subtitlePlaybackInfo";
import { axiosClient, useApiInContext } from "./api";
import { playAudio } from "./audioPlayback";
import useQueue, { setQueue, setTrackIndex } from "./queue";

type PlaybackStore = {
	itemName: string | React.Component | undefined | null;
	episodeTitle: string | React.Component;
	mediaSource: {
		videoTrack: number;
		audioTrack: number;
		container: string;
		id: string | undefined;
		subtitle: subtitlePlaybackInfo;
	};
	playbackStream: string;
	userId: string;
	startPosition: number;
	itemDuration: number;
	item: BaseItemDto | null;
	playsessionId: string | undefined | null;
	intro: IntroMediaInfo | undefined;
};

export const usePlaybackStore = create<PlaybackStore>(() => ({
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
	},
	enableSubtitle: true,
	playbackStream: "",
	userId: "",
	startPosition: 0,
	itemDuration: 0,
	item: null,
	playsessionId: "",
	intro: undefined,
}));

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
	subtitle: subtitlePlaybackInfo,
	intro: IntroMediaInfo | undefined,
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
		},
		playbackStream,
		userId,
		startPosition,
		itemDuration,
		item,
		playsessionId,
		intro,
	});
	usePlaybackStore.setState({
		itemName,
		episodeTitle,
		mediaSource: {
			videoTrack,
			audioTrack,
			container,
			id: mediaSourceId,
			subtitle,
		},
		playbackStream,
		userId,
		startPosition,
		itemDuration,
		item,
		playsessionId,
		intro,
	});
	setQueue(queue, queueItemIndex);
};

export const playItemFromQueue = async (
	index: "next" | "previous" | number,
	userId: string | undefined,
	api: Api,
) => {
	const queueItems = useQueue.getState().tracks;
	const currentItemIndex = useQueue.getState().currentItemIndex;
	const requestedItemIndex =
		index === "next"
			? currentItemIndex + 1
			: index === "previous"
				? currentItemIndex - 1
				: index;
	const item = queueItems[requestedItemIndex];
	if (item.Type === "Audio") {
		const urlOptions = {
			deviceId: api?.deviceInfo.id,
			userId,
			api_key: api?.accessToken,
		};
		const urlParams = new URLSearchParams(urlOptions).toString();

		const playbackUrl = `${api.basePath}/Audio/${item?.Id}/universal?${urlParams}`;
		console.log(item);
		playAudio(playbackUrl, item, undefined, queueItems, requestedItemIndex);
	} else {
		const mediaSource = (
			await getMediaInfoApi(api).getPostedPlaybackInfo({
				audioStreamIndex: item.MediaSources?.[0]?.DefaultAudioStreamIndex ?? 0,
				subtitleStreamIndex:
					item.MediaSources?.[0]?.DefaultSubtitleStreamIndex ?? 0,
				itemId: item.Id,
				startTimeTicks: item.UserData?.PlaybackPositionTicks,
				userId: userId,
				mediaSourceId: item.MediaSources?.[0].Id,
				playbackInfoDto: {
					DeviceProfile: playbackProfile,
				},
			})
		).data;
		console.log(mediaSource);
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
		console.log(subtitle);
		// URL generation
		const urlOptions = {
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

		let introInfo: undefined | AxiosResponse<IntroMediaInfo, any>;
		try {
			introInfo = (
				await axiosClient.get(
					`${api.basePath}/Episode/${item.Id}/IntroTimestamps`,
					{
						headers: {
							Authorization: `MediaBrowser Token=${api.accessToken}`,
						},
					},
				)
			)?.data;
		} catch (error) {
			console.error(error);
		}

		getPlaystateApi(api).reportPlaybackStopped({
			playbackStopInfo: {
				Failed: false,
				ItemId: item?.Id,
				MediaSourceId: mediaSource.MediaSources?.[0].Id,
				PlaySessionId: mediaSource.PlaySessionId,
			},
		});

		playItem(
			itemName,
			episodeTitle,
			videoTrack[0].Index,
			mediaSource.MediaSources?.[0].DefaultAudioStreamIndex,
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
		);
	}

	return "playing"; // Return any value to end mutation pending status
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
		enable: true,
	};
	usePlaybackStore.setState(prevState);
};