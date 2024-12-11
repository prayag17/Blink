import React, { memo, type MouseEvent } from "react"; // Import memo

import Button, { type ButtonProps } from "@mui/material/Button";
import Fab from "@mui/material/Fab";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";

import { generateAudioStreamUrl, playAudio } from "@/utils/store/audioPlayback";
import {
	type BaseItemDto,
	type BaseItemDtoQueryResult,
	BaseItemKind,
	ItemFields,
	ItemFilter,
	LocationType,
	type MediaSegmentDtoQueryResult,
	type PlaybackInfoResponse,
	SortOrder,
} from "@jellyfin/sdk/lib/generated-client";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getPlaylistsApi } from "@jellyfin/sdk/lib/utils/api/playlists-api";
import { getTvShowsApi } from "@jellyfin/sdk/lib/utils/api/tv-shows-api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useSnackbar } from "notistack";

import { setQueue } from "@/utils/store/queue";

import { playItem, usePlaybackDataLoadStore } from "@/utils/store/playback";

import type PlayResult from "@//utils/types/playResult";
import { getRuntimeCompact } from "@/utils/date/time";
import getSubtitle from "@/utils/methods/getSubtitles";
import playbackProfile from "@/utils/playback-profiles";
import { useApiInContext } from "@/utils/store/api";
import { usePhotosPlayback } from "@/utils/store/photosPlayback";
import { getMediaInfoApi } from "@jellyfin/sdk/lib/utils/api/media-info-api";
import { getMediaSegmentsApi } from "@jellyfin/sdk/lib/utils/api/media-segments-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
import { LoadingButton } from "@mui/lab";
import type { SxProps } from "@mui/material";
import type { AxiosResponse } from "axios";

type PlayButtonProps = {
	item: BaseItemDto;
	userId: string | undefined;
	itemType: BaseItemKind;
	currentAudioTrack?: number | "auto";
	currentVideoTrack?: number;
	currentSubTrack?: number | "nosub";
	className?: string;
	sx?: SxProps;
	buttonProps?: ButtonProps;
	iconOnly?: boolean;
	audio?: boolean;
	size?: "small" | "large" | "medium";
	playlistItem?: boolean;
	playlistItemId?: string;
	trackIndex?: number;
};

// Memoized LinearProgress component
const MemoizedLinearProgress = memo(({ value }: { value: number }) => (
	<LinearProgress
		variant="determinate"
		value={value}
		sx={{
			position: "absolute",
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			height: "100%",
			background: "transparent",
			opacity: 0.2,
			zIndex: 0,
			mixBlendMode: "difference",
		}}
		//@ts-ignore
		color="white"
	/>
));

const PlayButton = ({
	item,
	userId,
	itemType,
	currentAudioTrack,
	currentSubTrack,
	currentVideoTrack,
	className,
	sx,
	buttonProps,
	iconOnly,
	audio = false,
	size = "large",
	playlistItem,
	playlistItemId = "",
}: PlayButtonProps) => {
	const api = useApiInContext((s) => s.api);

	const navigate = useNavigate();
	const setPlaybackDataLoading = usePlaybackDataLoadStore(
		(state) => state.setisPending,
	);
	const playPhotos = usePhotosPlayback((s) => s.playPhotos);

	const { enqueueSnackbar } = useSnackbar();

	const itemQuery = useMutation({
		mutationKey: ["playButton", item?.Id, userId],
		mutationFn: async (currentEpisodeId?: string) => {
			setPlaybackDataLoading(true);
			let result: undefined | AxiosResponse<BaseItemDtoQueryResult, any>;
			let mediaSource: undefined | AxiosResponse<PlaybackInfoResponse, any>;
			let introInfo: undefined | MediaSegmentDtoQueryResult;
			let index = 0;
			if (!api) {
				throw new Error("API is not available");
			}
			if (!item.Id) {
				throw new Error("Item ID is not available");
			}
			if (playlistItem) {
				result = await getPlaylistsApi(api).getPlaylistItems({
					userId: userId,
					playlistId: playlistItemId,
				});
			} else {
				switch (itemType) {
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
								// startItemId: item.Id,
							});

							if (
								result.data.Items?.map((i) => i.Id).indexOf(
									currentEpisodeId,
								) === -1
							) {
								throw new Error(
									`Episode having id ${currentEpisodeId} not found, index return -1`,
								);
							}
							index =
								result.data.Items?.map((i) => i.Id).indexOf(currentEpisodeId) ??
								0;
							if (currentAudioTrack === "auto") {
								const defaultAudioStreamIndex =
									result.data.Items?.[index].MediaSources?.[0]
										.DefaultAudioStreamIndex;
								mediaSource = await getMediaInfoApi(api).getPostedPlaybackInfo({
									audioStreamIndex: Number(defaultAudioStreamIndex),
									subtitleStreamIndex:
										currentSubTrack === "nosub" ? -1 : currentSubTrack,
									itemId: result.data.Items?.[index]?.Id ?? "",
									startTimeTicks:
										result.data.Items?.[index].UserData?.PlaybackPositionTicks,
									userId: userId,
									mediaSourceId:
										result.data.Items?.[index].MediaSources?.[0]?.Id ?? "",
									playbackInfoDto: {
										DeviceProfile: playbackProfile,
									},
								});
							} else {
								mediaSource = await getMediaInfoApi(api).getPostedPlaybackInfo({
									audioStreamIndex: currentAudioTrack,
									subtitleStreamIndex:
										currentSubTrack === "nosub" ? -1 : currentSubTrack,
									itemId: result.data.Items?.[index]?.Id ?? "",
									startTimeTicks:
										result.data.Items?.[index].UserData?.PlaybackPositionTicks,
									userId: userId,
									mediaSourceId:
										result.data.Items?.[index].MediaSources?.[0]?.Id ?? "",
									playbackInfoDto: {
										DeviceProfile: playbackProfile,
									},
								});
							}
							introInfo = (
								await getMediaSegmentsApi(api).getItemSegments({
									itemId: result.data.Items?.[index]?.Id ?? "",
								})
							)?.data;
						}
						break;
					case BaseItemKind.Series:
						result = await getTvShowsApi(api).getEpisodes({
							seriesId: item.Id,
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
						if (
							currentEpisodeId &&
							result.data.Items?.map((i) => i.Id).indexOf(currentEpisodeId) ===
								-1
						) {
							throw new Error(
								`Episode having id=${currentEpisodeId} not found, index return -1`,
							);
						}
						if (!currentEpisodeId) {
							index = 0;
						} else {
							index =
								result.data.Items?.map((i) => i.Id).indexOf(currentEpisodeId) ??
								0;
						}
						if (
							result.data.Items?.[index].Id &&
							result.data.Items?.[index].MediaSources?.[0]?.Id
						) {
							if (currentAudioTrack === "auto") {
								const defaultAudioStreamIndex =
									result.data.Items?.[index].MediaSources?.[0]
										.DefaultAudioStreamIndex;
								mediaSource = await getMediaInfoApi(api).getPostedPlaybackInfo({
									audioStreamIndex: Number(defaultAudioStreamIndex),
									subtitleStreamIndex:
										currentSubTrack === "nosub" ? -1 : currentSubTrack,
									itemId: result.data.Items[index].Id ?? "",
									startTimeTicks:
										result.data.Items?.[0].UserData?.PlaybackPositionTicks,
									userId: userId,
									mediaSourceId:
										result.data.Items?.[index].MediaSources?.[0].Id ?? "",
									playbackInfoDto: {
										DeviceProfile: playbackProfile,
									},
								});
							} else {
								mediaSource = await getMediaInfoApi(api).getPostedPlaybackInfo({
									audioStreamIndex: currentAudioTrack,
									subtitleStreamIndex:
										currentSubTrack === "nosub" ? -1 : currentSubTrack,
									itemId: result.data.Items[index].Id ?? "",
									startTimeTicks:
										result.data.Items?.[0].UserData?.PlaybackPositionTicks,
									userId: userId,
									mediaSourceId:
										result.data.Items?.[index].MediaSources?.[0].Id ?? "",
									playbackInfoDto: {
										DeviceProfile: playbackProfile,
									},
								});
							}

							introInfo = (
								await getMediaSegmentsApi(api).getItemSegments({
									itemId: result.data.Items?.[index].Id ?? "",
								})
							)?.data;
						} else {
							throw new Error(
								`No media source id provieded for the episode. Return values are seriesId = ${result.data.Items?.[index].Id}, mediaSourceId = ${result.data.Items?.[index].MediaSources?.[0]?.Id}, index = ${index}`,
							);
						}
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
						if (
							result.data.Items?.[index]?.Id &&
							result.data.Items?.[index].MediaSources?.[0]?.Id
						) {
							if (currentAudioTrack === "auto") {
								const defaultAudioStreamIndex =
									result.data.Items?.[index].MediaSources?.[0]
										.DefaultAudioStreamIndex;
								mediaSource = await getMediaInfoApi(api).getPostedPlaybackInfo({
									audioStreamIndex: Number(defaultAudioStreamIndex),
									subtitleStreamIndex:
										currentSubTrack === "nosub" ? -1 : currentSubTrack,
									itemId: result.data.Items?.[index].Id ?? "",
									startTimeTicks:
										result.data.Items?.[0].UserData?.PlaybackPositionTicks,
									userId: userId,
									mediaSourceId:
										result.data.Items?.[index].MediaSources?.[0].Id ?? "",
									playbackInfoDto: {
										DeviceProfile: playbackProfile,
									},
								});
							} else {
								mediaSource = await getMediaInfoApi(api).getPostedPlaybackInfo({
									audioStreamIndex: currentAudioTrack,
									subtitleStreamIndex:
										currentSubTrack === "nosub" ? -1 : currentSubTrack,
									itemId: result.data.Items?.[index].Id ?? "",
									startTimeTicks:
										result.data.Items?.[0].UserData?.PlaybackPositionTicks,
									userId: userId,
									mediaSourceId:
										result.data.Items?.[index].MediaSources?.[0].Id ?? "",
									playbackInfoDto: {
										DeviceProfile: playbackProfile,
									},
								});
							}
						}
						break;
					case BaseItemKind.Photo:
						{
							const photo = (
								await getUserLibraryApi(api).getItem({
									itemId: item.Id,
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
						}
						break;
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
						if (currentAudioTrack === "auto") {
							const defaultAudioStreamIndex =
								result.data.Items?.[index].MediaSources?.[0]
									.DefaultAudioStreamIndex;
							mediaSource = await getMediaInfoApi(api).getPostedPlaybackInfo({
								audioStreamIndex: Number(defaultAudioStreamIndex),
								subtitleStreamIndex:
									currentSubTrack === "nosub" ? -1 : currentSubTrack,
								itemId: item.Id ?? "",
								startTimeTicks:
									result.data.Items?.[0].UserData?.PlaybackPositionTicks,
								userId: userId,
								mediaSourceId:
									result.data.Items?.[0].MediaSources?.[0]?.Id ?? "",
								playbackInfoDto: {
									DeviceProfile: playbackProfile,
								},
							});
						} else {
							mediaSource = await getMediaInfoApi(api).getPostedPlaybackInfo({
								audioStreamIndex: currentAudioTrack,
								subtitleStreamIndex:
									currentSubTrack === "nosub" ? -1 : currentSubTrack,
								itemId: item.Id ?? "",
								startTimeTicks:
									result.data.Items?.[0].UserData?.PlaybackPositionTicks,
								userId: userId,
								mediaSourceId:
									result.data.Items?.[0].MediaSources?.[0]?.Id ?? "",
								playbackInfoDto: {
									DeviceProfile: playbackProfile,
								},
							});
						}
						break;
				}
			}
			return {
				item: result?.data,
				mediaSource: mediaSource?.data,
				introInfo,
				episodeIndex: index,
			};
		},
		onSuccess: (result: PlayResult | null) => {
			if (!api) {
				console.error("API is not available");
				enqueueSnackbar("API is not available", { variant: "error" });
				return;
			}
			if (!userId) {
				console.error("User ID is not available");
				enqueueSnackbar("User ID is not available", { variant: "error" });
				return;
			}
			if (!result?.item?.Items?.length) {
				console.error("No items found");
				enqueueSnackbar("No items found", { variant: "error" });
				return;
			}
			if (!result?.item?.Items?.[0]?.Id) {
				console.error("No item ID found");
				enqueueSnackbar("No item ID found", { variant: "error" });
				return;
			}

			if (audio) {
				// Album/Individual audio track playback
				const playbackUrl = generateAudioStreamUrl(
					result?.item?.Items?.[0].Id,
					userId,
					api?.deviceInfo.id,
					api.basePath,
					api.accessToken,
				);
				playAudio(playbackUrl, result?.item?.Items?.[0], undefined);
				setQueue(result?.item?.Items ?? [], 0);
			} else if (item.Type === "Photo") {
				const index = result?.item?.Items?.map((i) => i.Id).indexOf(item.Id);
				if (result?.item?.Items && index) {
					playPhotos(result?.item?.Items, index);
					navigate({ to: "/player/photos" });
				}
			} else {
				if (!result?.mediaSource?.MediaSources?.[0]?.Id) {
					console.error("No media source ID found");
					enqueueSnackbar("No media source ID found", { variant: "error" });
					return;
				}
				const episodeIndex = result.episodeIndex;

				// Creates a queue containing all Episodes for a particular season(series) or collection of movies
				const queue = result?.item?.Items;

				let itemName = item.Name;
				let episodeTitle = "";
				if (result?.item?.Items?.[episodeIndex].SeriesId) {
					itemName = result?.item.Items[episodeIndex].SeriesName;
					episodeTitle = `S${result?.item.Items[episodeIndex].ParentIndexNumber ?? 0}:E${
						result?.item.Items[episodeIndex].IndexNumber ?? 0
					} ${result?.item.Items[episodeIndex].Name}`;
				}

				if (itemType === "BoxSet") {
					itemName = result.item.Items[0].Name;
				}

				// Subtitle
				const subtitle = getSubtitle(
					result.mediaSource.MediaSources?.[0].DefaultSubtitleStreamIndex ?? -1,
					result?.mediaSource?.MediaSources?.[0]?.MediaStreams,
				);

				// Audio
				const audio = {
					track:
						result.mediaSource.MediaSources?.[0].DefaultAudioStreamIndex ?? 0,
					allTracks: result.mediaSource.MediaSources?.[0].MediaStreams?.filter(
						(value) => value.Type === "Audio",
					),
				};

				// URL generation
				const urlOptions: URLSearchParams = {
					//@ts-ignore
					Static: true,
					tag: result?.mediaSource.MediaSources?.[0].ETag,
					mediaSourceId: result?.mediaSource.MediaSources?.[0].Id,
					deviceId: api?.deviceInfo.id,
					api_key: api?.accessToken,
				};
				const urlParams = new URLSearchParams(urlOptions).toString();
				let playbackUrl = `${api?.basePath}/Videos/${result?.mediaSource.MediaSources?.[0].Id}/stream.${result?.mediaSource.MediaSources?.[0].Container}?${urlParams}`;
				if (
					result?.mediaSource.MediaSources?.[0].SupportsTranscoding &&
					result?.mediaSource.MediaSources?.[0].TranscodingUrl
				) {
					playbackUrl = `${api.basePath}${result.mediaSource.MediaSources[0].TranscodingUrl}`;
				}
				let playItemValue = result?.item?.Items?.[episodeIndex];
				if (itemType === BaseItemKind.Movie) {
					playItemValue = result?.item?.Items?.[0];
				}

				const startPosition =
					result?.item?.Items?.[episodeIndex].UserData?.PlaybackPositionTicks;

				playItem(
					itemName,
					episodeTitle,
					currentVideoTrack ?? 0,
					Number(result.mediaSource.MediaSources?.[0].DefaultAudioStreamIndex),
					result?.mediaSource?.MediaSources?.[0].Container ?? "mkv",
					playbackUrl,
					userId ?? "",
					startPosition,
					result?.item?.Items?.[episodeIndex].RunTimeTicks,
					playItemValue ?? item,
					queue,
					episodeIndex,
					result?.mediaSource?.MediaSources?.[0]?.Id,
					result?.mediaSource?.PlaySessionId,
					subtitle,
					result?.introInfo,
					audio,
				);
				navigate({ to: "/player" });
			}
		},
		onSettled: () => {
			setPlaybackDataLoading(false);
		},
		onError: (error) => {
			console.error(error);
			enqueueSnackbar(`${error}`, {
				variant: "error",
			});
		},
	});
	const handleClick = (
		e: MouseEvent<HTMLAnchorElement | MouseEvent>,
		currentEpisodeId?: string | undefined,
	) => {
		e.stopPropagation();
		itemQuery.mutate(currentEpisodeId);
	};
	if (iconOnly) {
		return (
			//@ts-ignore
			<Fab
				color="primary"
				aria-label="Play"
				className={className}
				onClick={(e) =>
					item.Type === "Episode" ? handleClick(e, item.Id) : handleClick(e)
				}
				sx={sx}
				size={size}
				{...buttonProps}
			>
				<div
					className="material-symbols-rounded em-4 fill"
					style={{
						fontSize: "3em",
					}}
				>
					play_arrow
				</div>
			</Fab>
		);
	}

	if (itemType === BaseItemKind.Series) {
		const currentEpisode = useQuery({
			queryKey: ["playButton", "currentEpisode", item?.Id],
			queryFn: async () => {
				if (!api) {
					throw new Error("API is not available");
				}
				if (!userId) {
					throw new Error("User ID is not available");
				}
				if (!item.Id) {
					throw new Error("Item ID is not available");
				}
				let data: BaseItemDtoQueryResult | null = null;
				const continueWatching = await getItemsApi(api).getResumeItems({
					userId: userId,
					limit: 1,
					mediaTypes: ["Video"],
					parentId: item.Id,
					enableUserData: true,
					fields: [ItemFields.MediaStreams, ItemFields.MediaSources],
				});
				const nextUp = await getTvShowsApi(api).getNextUp({
					userId: userId,
					parentId: item.Id,
					limit: 1,
				});
				if ((continueWatching.data.Items?.length ?? 0) > 0) {
					data = continueWatching.data;
				} else if ((nextUp.data.Items?.length ?? 0) > 0) {
					data = nextUp.data;
				} else {
					return null;
				}
				return data;
			},
			// enabled: itemType === BaseItemKind.Series,
		});
		return (
			<div
				className="play-button"
				style={{
					width: "auto",
					position: "relative",
				}}
			>
				<LoadingButton
					loading={currentEpisode.isPending}
					className={className ?? "play-button"}
					variant="contained"
					onClick={(e) => handleClick(e, currentEpisode.data?.Items?.[0]?.Id)}
					startIcon={
						<div
							className="material-symbols-rounded fill"
							style={{
								zIndex: 1,
								fontSize: "2em",
							}}
						>
							play_arrow
						</div>
					}
					{...buttonProps}
					sx={{
						position: "relative",
						overflow: "hidden",
					}}
					//@ts-ignore - white color is a custom color in the theme which mui's types don't know about
					color="white"
					size={size}
				>
					Watch S{currentEpisode.data?.Items?.[0].ParentIndexNumber ?? 1}E
					{currentEpisode.data?.Items?.[0]?.IndexNumber ?? 1}
					<MemoizedLinearProgress
						//@ts-ignore
						value={
							100 >
								(currentEpisode.data?.Items?.[0].UserData?.PlayedPercentage ??
									100) &&
							(currentEpisode.data?.Items?.[0].UserData?.PlayedPercentage ??
								0) > 0
								? currentEpisode.data?.Items?.[0].UserData?.PlayedPercentage
								: 0
						}
					/>
				</LoadingButton>
				{(currentEpisode.data?.Items?.[0].UserData?.PlaybackPositionTicks ??
					0) > 0 && (
					<Typography
						sx={{
							opacity: 0.8,
							position: "absolute",
							bottom: "-1.8em",
							left: "50%",
							transform: "translate(-50%)",
						}}
						variant="caption"
					>
						{getRuntimeCompact(
							(currentEpisode.data?.Items?.[0].RunTimeTicks ?? 0) -
								(currentEpisode.data?.Items?.[0].UserData
									?.PlaybackPositionTicks ?? 0),
						)}{" "}
						left
					</Typography>
				)}
			</div>
		);
	}
	return (
		<div
			className="play-button"
			style={{
				width: "auto",
				position: "relative",
			}}
		>
			<Button
				className={className ?? "play-button"}
				variant="contained"
				onClick={(e) =>
					item.Type === "Episode" ? handleClick(e, item.Id) : handleClick(e)
				}
				startIcon={
					<div
						className="material-symbols-rounded fill"
						style={{
							zIndex: 1,
							fontSize: "2em",
						}}
					>
						play_arrow
					</div>
				}
				{...buttonProps}
				sx={{
					position: "relative",
					overflow: "hidden",
				}}
				//@ts-ignore - white color is a custom color in the theme which mui's types don't know about
				color="white"
				size={size}
			>
				{item.UserData?.PlaybackPositionTicks
					? "Continue Watching"
					: item?.Type === "MusicAlbum" ||
							item?.Type === "Audio" ||
							item?.Type === "AudioBook" ||
							item?.Type === "Playlist" ||
							audio
						? "Play Now"
						: "Watch Now"}
				<MemoizedLinearProgress
					//@ts-ignore
					value={
						100 > (item.UserData?.PlayedPercentage ?? 100) &&
						(item.UserData?.PlayedPercentage ?? 0) > 0
							? item.UserData?.PlayedPercentage
							: 0
					}
				/>
			</Button>
			{(item.UserData?.PlaybackPositionTicks ?? 0) > 0 && (
				<Typography
					sx={{
						opacity: 0.8,
						position: "absolute",
						bottom: "-1.8em",
						left: "50%",
						transform: "translate(-50%)",
					}}
					variant="caption"
				>
					{getRuntimeCompact(
						(item.RunTimeTicks ?? 0) -
							(item.UserData?.PlaybackPositionTicks ?? 0),
					)}{" "}
					left
				</Typography>
			)}
		</div>
	);
};

export default PlayButton;
