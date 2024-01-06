/** @format */
import React from "react";
import PropTypes from "prop-types";

import Button from "@mui/material/Button";
import Fab from "@mui/material/Fab";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";

import {
	setItem,
	usePlaybackDataLoadStore,
	usePlaybackStore,
} from "../../utils/store/playback";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { getTvShowsApi } from "@jellyfin/sdk/lib/utils/api/tv-shows-api";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import {
	BaseItemKind,
	ItemFields,
	SortOrder,
} from "@jellyfin/sdk/lib/generated-client";
import { useSnackbar } from "notistack";
import { useAudioPlayback } from "../../utils/store/audioPlayback";
import { getPlaylistsApi } from "@jellyfin/sdk/lib/utils/api/playlists-api";
import { useApi } from "../../utils/store/api";

const PlayButton = ({
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

	const item = useMutation({
		mutationKey: ["playButton", itemId, userId],
		mutationFn: async () => {
			setPlaybackDataLoading(true);
			let result;
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
							startIndex: 0,
							fields: [
								ItemFields.MediaSources,
								ItemFields.MediaStreams,
							],
							enableUserData: true,
						});
						break;
					case BaseItemKind.Playlist:
						result = await getPlaylistsApi(
							api,
						).getPlaylistItems({
							userId: userId,
							playlistId: playlistItemId,
						});
						break;
					case BaseItemKind.MusicAlbum:
						result = await getItemsApi(api).getItems({
							parentId: itemId,
							userId: userId,
							fields: [
								ItemFields.MediaSources,
								ItemFields.MediaStreams,
							],
							sortOrder: SortOrder.Ascending,
							sortBy: "IndexNumber",
						});
						break;
					case BaseItemKind.MusicArtist:
						result = await getItemsApi(api).getItems({
							artistIds: [itemId],
							recursive: true,
							includeItemTypes: [BaseItemKind.Audio],
							userId: userId,
							fields: [
								ItemFields.MediaSources,
								ItemFields.MediaStreams,
							],
							sortOrder: SortOrder.Ascending,
							sortBy: [
								"PremiereDate",
								"ProductionYear",
								"SortName",
							],
						});
						break;
					default:
						result = await getItemsApi(api).getItems({
							ids: [itemId],
							userId: userId,
							fields: [
								ItemFields.MediaSources,
								ItemFields.MediaStreams,
							],
							sortOrder: SortOrder.Ascending,
							sortBy: "IndexNumber",
						});
						break;
				}
			}
			return result.data;
		},
		onSuccess: (item) => {
			console.log(item.Items[0].MediaSources);
			if (trackIndex) {
				setPlaylistItemId(playlistItemId);
				setCurrentTrack(trackIndex);
				setAudioTracks(item.Items);
				setAudioUrl(
					`${api.basePath}/Audio/${item.Items[trackIndex].Id}/universal?deviceId=${api.deviceInfo.id}&userId=${userId}&api_key=${api.accessToken}`,
				);
				setAudioItem(item.Items[trackIndex]);
				setAudioDisplay(true);
			} else if (audio) {
				setAudioItem(item.Items[0]);
				setAudioTracks(item.Items);
				setAudioUrl(
					`${api.basePath}/Audio/${item.Items[0].Id}/universal?deviceId=${api.deviceInfo.id}&userId=${userId}&api_key=${api.accessToken}`,
				);
				setAudioDisplay(true);
			} else {
				setUserId(userId);
				setItemId(item.Items[0].Id);
				setDuration(item.Items[0].RunTimeTicks);

				if (item.Items[0].Type == BaseItemKind.Episode) {
					setSeriesId(item.Items[0].SeriesId);
					// setEpisodeIndex(item.Ite)
				}

				setMediaContainer(item.Items[0].MediaSources[0].Container);
				// Set all required stream index
				setAudioStreamIndex(currentAudioTrack);
				setVideoStreamIndex(currentVideoTrack);
				setSubtitleStreamIndex(currentSubTrack);

				setMediaSourceId(item.Items[0].Id);
				setItem(item.Items[0]);

				switch (item.Items[0].Type) {
					case BaseItemKind.Movie:
						if (item.Items[0].ImageBlurHashes.Logo) {
							setItemName(
								<div className="video-osd-name">
									<img
										src={`${api.basePath}/Items/${item.Items[0].Id}/Images/Logo`}
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
									<Typography variant="h6">
										{item.Items[0].Name}
									</Typography>
								</div>,
							);
						}
						break;
					case BaseItemKind.Episode:
						if (item.Items[0].ImageBlurHashes.Logo) {
							setItemName(
								<div className="video-osd-name">
									<img
										src={`${api.basePath}/Items/${item.Items[0].SeriesId}/Images/Logo`}
										className="video-osd-name-logo"
										onLoad={(e) => {
											e.target.style.opacity = 1;
										}}
									/>
									<Typography variant="subtitle1">
										S
										{
											item.Items[0]
												.ParentIndexNumber
										}
										:E
										{
											item.Items[0].IndexNumber
										}{" "}
										{item.Items[0].Name}
									</Typography>
								</div>,
							);
						} else {
							setItemName(
								<div className="video-osd-name">
									<Typography variant="h6">
										{item.Items[0].SeriesName}
									</Typography>
									<Typography variant="subtitle1">
										S
										{
											item.Items[0]
												.ParentIndexNumber
										}
										:E
										{
											item.Items[0].IndexNumber
										}{" "}
										{item.Items[0].Name}
									</Typography>
								</div>,
							);
						}

						break;
					default:
						setItemName(
							<div className="video-osd-name">
								<Typography variant="h6">
									{item.Items[0].Name}
								</Typography>
							</div>,
						);
						break;
				}
				setPosition(item.Items[0].UserData?.PlaybackPositionTicks);

				setUrl(
					`${api.basePath}/Videos/${item.Items[0].Id}/stream.
									${item.Items[0].MediaSources[0].Container}
								?Static=true&mediaSourceId=${item.Items[0].Id}&deviceId=${api.deviceInfo.id}&api_key=${api.accessToken}&Tag=${item.Items[0].MediaSources[0].ETag}&videoStreamIndex=${currentVideoTrack}&audioStreamIndex=${currentAudioTrack}`,
				);

				navigate(`/player`);
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
		item.mutate();
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
	} else {
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
	}
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
