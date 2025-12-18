import type { Api } from "@jellyfin/sdk";
import {
	type BaseItemDto,
	BaseItemKind,
	ItemFields,
	ItemFilter,
	ItemSortBy,
	LocationType,
	SortOrder,
} from "@jellyfin/sdk/lib/generated-client";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getMediaInfoApi } from "@jellyfin/sdk/lib/utils/api/media-info-api";
import { getMediaSegmentsApi } from "@jellyfin/sdk/lib/utils/api/media-segments-api";
import { getPlaylistsApi } from "@jellyfin/sdk/lib/utils/api/playlists-api";
import { getTvShowsApi } from "@jellyfin/sdk/lib/utils/api/tv-shows-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
import playbackProfile from "@/utils/playback-profiles";

export async function getNextEpisode(
	api: Api,
	userId: string,
	seriesId: string,
	season: number,
) {
	const episode = (
		await getTvShowsApi(api).getEpisodes({
			seriesId: seriesId,
			userId: userId,
			enableUserData: true,
			season,
			fields: [ItemFields.MediaStreams, ItemFields.MediaSources],
		})
	).data.Items?.find((ep) => ep.UserData?.Played !== true);

	if (episode) {
		return episode;
	}

	const allEpisodes = (
		await getTvShowsApi(api).getEpisodes({
			seriesId: seriesId,
			userId: userId,
			enableUserData: true,
			fields: [ItemFields.MediaStreams, ItemFields.MediaSources],
		})
	).data.Items;

	if (allEpisodes) {
		return allEpisodes[0];
	}

	return null;
}

export interface PlaybackInfoOptions {
	currentAudioTrack?: number | "auto";
	currentSubTrack?: number | "nosub";
	currentEpisodeId?: string;
	playlistItem?: boolean;
	playlistItemId?: string;
}

export async function getPlaybackInfo(
	api: Api,
	userId: string,
	item: BaseItemDto,
	options: PlaybackInfoOptions = {},
) {
	const {
		currentAudioTrack = "auto",
		currentSubTrack,
		currentEpisodeId,
		playlistItem,
		playlistItemId,
	} = options;

	let result: any;
	let mediaSource: any;
	let mediaSegments: any;
	let index = 0;

	if (playlistItem && playlistItemId) {
		result = await getPlaylistsApi(api).getPlaylistItems({
			userId: userId,
			playlistId: playlistItemId,
		});
	} else {
		switch (item.Type) {
			case BaseItemKind.Episode:
				if (item.SeriesId && item.SeasonId) {
					result = await getTvShowsApi(api).getEpisodes({
						seriesId: item.SeriesId,
						fields: [
							ItemFields.MediaSources,
							ItemFields.MediaStreams,
							ItemFields.Overview,
							ItemFields.Chapters,
							ItemFields.Trickplay,
						],
						enableUserData: true,
						userId: userId,
						seasonId: item.SeasonId,
						isMissing: false,
					});

					if (currentEpisodeId) {
						index =
							result.data.Items?.map((i: any) => i.Id).indexOf(
								currentEpisodeId,
							) ?? 0;
					} else {
						index =
							result.data.Items?.map((i: any) => i.Id).indexOf(item.Id) ?? 0;
					}

					if (index === -1) index = 0;
				}
				break;
			case BaseItemKind.Series:
				result = await getTvShowsApi(api).getEpisodes({
					seriesId: item.Id || "",
					fields: [
						ItemFields.MediaSources,
						ItemFields.MediaStreams,
						ItemFields.Overview,
						ItemFields.Chapters,
						ItemFields.Trickplay,
					],
					enableUserData: true,
					userId: userId,
					isMissing: false,
				});

				if (currentEpisodeId) {
					index =
						result.data.Items?.map((i: any) => i.Id).indexOf(
							currentEpisodeId,
						) ?? 0;
				}
				if (index === -1) index = 0;
				break;
			case BaseItemKind.Playlist:
			case BaseItemKind.MusicAlbum:
				result = await getItemsApi(api).getItems({
					parentId: item.Id,
					userId: userId,
					fields: [ItemFields.MediaSources, ItemFields.MediaStreams],
					sortOrder: [SortOrder.Ascending],
					sortBy: ["IndexNumber"],
				});
				break;
			case BaseItemKind.MusicArtist:
				result = await getItemsApi(api).getItems({
					artistIds: [item.Id ?? ""],
					recursive: true,
					includeItemTypes: [BaseItemKind.Audio],
					userId: userId,
					fields: [ItemFields.MediaSources, ItemFields.MediaStreams],
					sortOrder: [SortOrder.Ascending],
					sortBy: ["PremiereDate", "ProductionYear", "SortName"],
				});
				break;
			case BaseItemKind.BoxSet:
				result = await getItemsApi(api).getItems({
					parentId: item.Id,
					userId,
					fields: [
						ItemFields.MediaSources,
						ItemFields.MediaStreams,
						ItemFields.Chapters,
						ItemFields.Trickplay,
					],
					sortOrder: [SortOrder.Ascending],
					sortBy: ["IndexNumber"],
				});
				break;
			case BaseItemKind.Photo: {
				const photo = (
					await getUserLibraryApi(api).getItem({
						itemId: item.Id || "",
					})
				).data;
				result = await getItemsApi(api).getItems({
					parentId: photo.ParentId ?? "",
					filters: [ItemFilter.IsNotFolder],
					recursive: false,
					sortBy: ["SortName"],
					mediaTypes: ["Photo"],
					excludeLocationTypes: [LocationType.Virtual],
					collapseBoxSetItems: false,
				});
				break;
			}
			default:
				result = await getItemsApi(api).getItems({
					ids: [item.Id ?? ""],
					userId: userId,
					fields: [
						ItemFields.MediaSources,
						ItemFields.MediaStreams,
						ItemFields.Chapters,
						ItemFields.Trickplay,
					],
					sortOrder: [SortOrder.Ascending],
					sortBy: ["IndexNumber"],
				});
				break;
		}
	}

	if (
		result?.data?.Items?.[index]?.Id &&
		(result.data.Items[index].MediaSources?.[0]?.Id ||
			item.Type === BaseItemKind.Photo)
	) {
		const targetItem = result.data.Items[index];
		if (item.Type !== BaseItemKind.Photo) {
			let audioStreamIndex = currentAudioTrack;
			if (audioStreamIndex === "auto") {
				audioStreamIndex =
					targetItem.MediaSources?.[0].DefaultAudioStreamIndex ?? 0;
			}

			mediaSource = await getMediaInfoApi(api).getPostedPlaybackInfo({
				audioStreamIndex: Number(audioStreamIndex),
				subtitleStreamIndex: currentSubTrack === "nosub" ? -1 : currentSubTrack,
				itemId: targetItem.Id,
				startTimeTicks: targetItem.UserData?.PlaybackPositionTicks,
				userId: userId,
				mediaSourceId: targetItem.MediaSources?.[0]?.Id,
				playbackInfoDto: {
					DeviceProfile: playbackProfile,
				},
			});

			mediaSegments = (
				await getMediaSegmentsApi(api).getItemSegments({
					itemId: targetItem.Id,
				})
			)?.data;
		}
	}

	return {
		item: result?.data,
		mediaSource: mediaSource?.data,
		mediaSegments,
		episodeIndex: index,
	};
}
