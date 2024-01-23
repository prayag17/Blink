import PropTypes from "prop-types";
import React from "react";

import Button, {
	ButtonProps,
	ButtonPropsSizeOverrides,
} from "@mui/material/Button";
import Fab from "@mui/material/Fab";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";

import {
	BaseItemDto,
	BaseItemKind,
	ItemFields,
	SortOrder,
	UserItemDataDto,
} from "@jellyfin/sdk/lib/generated-client";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getPlaylistsApi } from "@jellyfin/sdk/lib/utils/api/playlists-api";
import { getTvShowsApi } from "@jellyfin/sdk/lib/utils/api/tv-shows-api";
import { useMutation } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import { useApi } from "../../utils/store/api";
import { useAudioPlayback } from "../../utils/store/audioPlayback";
import {
	setItem,
	usePlaybackDataLoadStore,
	usePlaybackStore,
} from "../../utils/store/playback";

import { SxProps } from "@mui/material";

const PlayButton = ({
	item,
	itemId,
	itemUserData,
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
	trackIndex,
}: {
	item: BaseItemDto;
	itemId: string;
	itemUserData: UserItemDataDto;
	userId: string;
	itemType: BaseItemKind;
	currentAudioTrack: number;
	currentVideoTrack: number;
	currentSubTrack: number;
	className: string;
	sx: SxProps;
	buttonProps: ButtonProps;
	iconOnly: boolean;
	audio: boolean;
	size: ButtonPropsSizeOverrides;
	playlistItem: BaseItemDto;
	playlistItemId: string;
	trackIndex: number;
}) => {
	const [api] = useApi((state) => [state.api]);

	const navigate = useNavigate();
	const [
		setUrl,
		setPosition,
		setDuration,
		setItemId,
		setItemName,
		setAudioStreamIndex,
		setVideoStreamIndex,
		setSubtitleStreamIndex,
		setMediaSourceId,
		setUserId,
		setMediaContainer,
		setSeriesId,
		setEpisodeIndex,
	] = usePlaybackStore((state) => [
		state.setUrl,
		state.setPosition,
		state.setDuration,
		state.setItemId,
		state.setItemName,
		state.setAudioStreamIndex,
		state.setVideoStreamIndex,
		state.setSubtitleStreamIndex,
		state.setMediaSourceId,
		state.setUserId,
		state.setMediaContainer,
		state.setSeriesId,
		state.setEpisodeIndex,
	]);
	const [
		setAudioUrl,
		setAudioDisplay,
		setAudioItem,
		setAudioTracks,
		setCurrentTrack,
		setPlaylistItemId,
	] = useAudioPlayback((state) => [
		state.setUrl,
		state.setDisplay,
		state.setItem,
		state.setTracks,
		state.setCurrentTrack,
		state.setPlaylistItemId,
	]);
	const setPlaybackDataLoading = usePlaybackDataLoadStore(
		(state) => state.setisPending,
	);

	const { enqueueSnackbar } = useSnackbar();

	const itemQuery = useMutation({
		mutationKey: ["playButton", itemId, userId],
		mutationFn: async () => {
			setPlaybackDataLoading(true);
			let result: any;
			if (playlistItem) {
				result = await getPlaylistsApi(api).getPlaylistItems({
					userId: userId,
					playlistId: playlistItemId,
				});
			} else {
				switch (itemType) {
					case BaseItemKind.Series:
						result = await getTvShowsApi(api).getEpisodes({
							seriesId: itemId,
							limit: 1,
							fields: [ItemFields.MediaSources, ItemFields.MediaStreams],
							enableUserData: true,
							userId: userId,
						});
						break;
					case BaseItemKind.Playlist:
						result = await getPlaylistsApi(api).getPlaylistItems({
							userId: userId,
							playlistId: playlistItemId,
						});
						break;
					case BaseItemKind.MusicAlbum:
						result = await getItemsApi(api).getItems({
							parentId: itemId,
							userId: userId,
							fields: [ItemFields.MediaSources, ItemFields.MediaStreams],
							sortOrder: SortOrder.Ascending,
							sortBy: ["IndexNumber"],
						});
						break;
					case BaseItemKind.MusicArtist:
						result = await getItemsApi(api).getItems({
							artistIds: [itemId],
							recursive: true,
							includeItemTypes: [BaseItemKind.Audio],
							userId: userId,
							fields: [ItemFields.MediaSources, ItemFields.MediaStreams],
							sortOrder: SortOrder.Ascending,
							sortBy: ["PremiereDate", "ProductionYear", "SortName"],
						});
						break;
					case BaseItemKind.BoxSet:
						result = await getItemsApi(api).getItems({
							parentId: itemId,
							userId,
							fields: [ItemFields.MediaSources, ItemFields.MediaStreams],
							sortOrder: SortOrder.Ascending,
							sortBy: "IndexNumber",
						});
						break;
					default:
						result = await getItemsApi(api).getItems({
							ids: [itemId],
							userId: userId,
							fields: [ItemFields.MediaSources, ItemFields.MediaStreams],
							sortOrder: SortOrder.Ascending,
							sortBy: "IndexNumber",
						});
						break;
				}
			}
			return result.data;
		},
		onSuccess: (result) => {
			console.log(result.Items[0].MediaSources);
			if (trackIndex) {
				setPlaylistItemId(playlistItemId);
				setCurrentTrack(trackIndex);
				setAudioTracks(result.Items);
				setAudioUrl(
					`${api.basePath}/Audio/${result.Items[trackIndex].Id}/universal?deviceId=${api.deviceInfo.id}&userId=${userId}&api_key=${api.accessToken}`,
				);
				setAudioItem(result.Items[trackIndex]);
				setAudioDisplay(true);
			} else if (audio) {
				setAudioItem(result.Items[0]);
				setAudioTracks(result.Items);
				setAudioUrl(
					`${api.basePath}/Audio/${result.Items[0].Id}/universal?deviceId=${api.deviceInfo.id}&userId=${userId}&api_key=${api.accessToken}`,
				);
				setAudioDisplay(true);
			} else {
				setUserId(userId);
				setItemId(result.Items[0].Id);
				setDuration(result.Items[0].RunTimeTicks);

				if (result.Items[0].Type === BaseItemKind.Episode) {
					setSeriesId(result.Items[0].SeriesId);
					// setEpisodeIndex(result.Ite)
				}

				setMediaContainer(result.Items[0].MediaSources[0].Container);
				// Set all required stream index
				setAudioStreamIndex(currentAudioTrack);
				setVideoStreamIndex(currentVideoTrack);
				setSubtitleStreamIndex(currentSubTrack);

				setMediaSourceId(result.Items[0].Id);
				setItem(result.Items[0]);

				switch (result.Items[0].Type) {
					case BaseItemKind.Movie:
						if (result.Items[0].ImageBlurHashes.Logo) {
							setItemName(
								<div className="video-osd-name">
									<img
										alt={result.Items[0].Name}
										src={`${api.basePath}/Items/${result.Items[0].Id}/Images/Logo`}
										className="video-osd-name-logo"
										onLoad={(e) => {
											e.target.style.opacity = 1;
										}}
									/>
								</div>,
							);
						} else {
							setItemName(
								<div className="video-osd-name">
									<Typography variant="h6">{result.Items[0].Name}</Typography>
								</div>,
							);
						}
						break;
					case BaseItemKind.Episode:
						if (result.Items[0].ImageBlurHashes.Logo) {
							setItemName(
								<div className="video-osd-name">
									<img
										alt={result.Items[0].SeriesName}
										src={`${api.basePath}/Items/${result.Items[0].SeriesId}/Images/Logo`}
										className="video-osd-name-logo"
										onLoad={(e) => {
											e.target.style.opacity = 1;
										}}
									/>
									<Typography variant="subtitle1">
										S{result.Items[0].ParentIndexNumber}
										:E
										{result.Items[0].IndexNumber} {result.Items[0].Name}
									</Typography>
								</div>,
							);
						} else {
							setItemName(
								<div className="video-osd-name">
									<Typography variant="h6">
										{result.Items[0].SeriesName}
									</Typography>
									<Typography variant="subtitle1">
										S{result.Items[0].ParentIndexNumber}
										:E
										{result.Items[0].IndexNumber} {result.Items[0].Name}
									</Typography>
								</div>,
							);
						}

						break;
					default:
						setItemName(
							<div className="video-osd-name">
								<Typography variant="h6">{result.Items[0].Name}</Typography>
							</div>,
						);
						break;
				}
				setPosition(result.Items[0].UserData?.PlaybackPositionTicks);

				setUrl(
					`${api.basePath}/Videos/${result.Items[0].Id}/stream.
									${result.Items[0].MediaSources[0].Container}
								?Static=true&mediaSourceId=${result.Items[0].Id}&deviceId=${api.deviceInfo.id}&api_key=${api.accessToken}&Tag=${result.Items[0].MediaSources[0].ETag}&videoStreamIndex=${currentVideoTrack}&audioStreamIndex=${currentAudioTrack}`,
				);

				navigate("/player");
			}
		},
		onSettled: () => {
			setPlaybackDataLoading(false);
		},
		onError: (error) => {
			enqueueSnackbar(`${error}`, {
				variant: "error",
			});
		},
	});
	const handleClick = (e) => {
		e.stopPropagation();
		itemQuery.mutate();
	};
	if (iconOnly) {
		return (
			<Fab
				color="primary"
				aria-label="Play"
				className={className}
				onClick={handleClick}
				sx={sx}
				size={size}
				{...buttonProps}
			>
				<div
					className="material-symbols-rounded em-4"
					style={{
						fontSize: "3em",
					}}
				>
					play_arrow
				</div>
			</Fab>
		);
	}
	return (
		<Button
			className={className}
			variant="contained"
			onClick={handleClick}
			startIcon={
				<div
					className="material-symbols-rounded"
					style={{
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
			size={size}
		>
			<LinearProgress
				variant="determinate"
				value={
					100 > itemUserData.PlayedPercentage > 0
						? itemUserData.PlayedPercentage
						: 0
				}
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
				}}
				color="white"
			/>
			{itemUserData.PlaybackPositionTicks > 0 ? "Resume" : "Play"}
		</Button>
	);
};

export default PlayButton;

PlayButton.propTypes = {
	itemId: PropTypes.string,
	itemUserData: PropTypes.object,
	userId: PropTypes.string,
	itemType: PropTypes.string,
	currentAudioTrack: PropTypes.number,
	currentSubTrack: PropTypes.number,
	currentVideoTrack: PropTypes.number,
	className: PropTypes.string,
	sx: PropTypes.any,
	iconProps: PropTypes.any,
	buttonProps: PropTypes.any,
	iconOnly: PropTypes.bool,
};
