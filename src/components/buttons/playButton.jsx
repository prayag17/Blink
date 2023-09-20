/** @format */
import PropTypes from "prop-types";

import Button from "@mui/material/Button";
import Fab from "@mui/material/Fab";
import LinearProgress from "@mui/material/LinearProgress";
import { MdiPlayOutline } from "../icons/mdiPlayOutline";
import {
	usePlaybackDataLoadStore,
	usePlaybackStore,
} from "../../utils/store/playback";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
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
	iconProps,
	buttonProps,
	iconOnly,
	audio = false,
	size = "large",
	playlistItem,
	playlistItemId = "",
}) => {
	const navigate = useNavigate();
	const [
		setUrl,
		setPosition,
		setDuration,
		setItemId,
		setItemName,
		setSubtitleTracksStore,
		setSelectedSubtitleTrack,
	] = usePlaybackStore((state) => [
		state.setUrl,
		state.setPosition,
		state.setDuration,
		state.setItemId,
		state.setItemName,
		state.setSubtitleTracks,
		state.setSelectedSubtitleTrack,
	]);
	const [
		setAudioUrl,
		setAudioDisplay,
		setAudioItem,
		setAudioTracks,
		setPlaylistItemId,
	] = useAudioPlayback((state) => [
		state.setUrl,
		state.setDisplay,
		state.setItem,
		state.setTracks,
		state.setPlaylistItemId,
	]);
	const setPlaybackDataLoading = usePlaybackDataLoadStore(
		(state) => state.setIsLoading,
	);

	const { enqueueSnackbar } = useSnackbar();

	const item = useMutation({
		mutationKey: ["playButton", itemId, userId],
		mutationFn: async () => {
			setPlaybackDataLoading(true);
			let result;
			if (itemType == "Series") {
				result = await getTvShowsApi(window.api).getEpisodes({
					seriesId: itemId,
					limit: 1,
					startIndex: 0,
					fields: [
						ItemFields.MediaSources,
						ItemFields.MediaStreams,
					],
				});
			} else if (itemType == BaseItemKind.Playlist || playlistItem) {
				result = await getPlaylistsApi(window.api).getPlaylistItems(
					{
						userId: userId,
						playlistId: playlistItemId,
					},
				);
			} else if (itemType == BaseItemKind.MusicAlbum) {
				result = await getItemsApi(window.api).getItems({
					parentId: itemId,
					userId: userId,
					fields: [
						ItemFields.MediaSources,
						ItemFields.MediaStreams,
					],
					sortOrder: SortOrder.Ascending,
					sortBy: "IndexNumber",
				});
			} else if (itemType == BaseItemKind.MusicArtist) {
				result = await getItemsApi(window.api).getItems({
					artistIds: [itemId],
					recursive: true,
					includeItemTypes: [BaseItemKind.Audio],
					userId: userId,
					fields: [
						ItemFields.MediaSources,
						ItemFields.MediaStreams,
					],
					sortOrder: SortOrder.Ascending,
					sortBy: ["PremiereDate", "ProductionYear", "SortName"],
				});
			} else {
				result = await getItemsApi(window.api).getItems({
					ids: [itemId],
					userId: userId,
					fields: [
						ItemFields.MediaSources,
						ItemFields.MediaStreams,
					],
					sortOrder: SortOrder.Ascending,
					sortBy: "IndexNumber",
				});
			}
			return result.data;
		},
		onSuccess: (item) => {
			if (audio) {
				setAudioTracks(item.Items);
				setAudioUrl(
					`${window.api.basePath}/Audio/${item.Items[0].Id}/universal?deviceId=${window.api.deviceInfo.id}&userId=${userId}&api_key=${window.api.accessToken}`,
				);
				setAudioItem(item.Items[0]);
				setPlaylistItemId(playlistItemId);
				setAudioDisplay(true);
			} else {
				setUrl(
					`${window.api.basePath}/Videos/${item.Items[0].Id}/stream.
					${item.Items[0].MediaSources[0].Container}
				?Static=true&mediaSourceId=${item.Items[0].Id}&deviceId=${window.api.deviceInfo.id}&api_key=${window.api.accessToken}&Tag=${item.Items[0].MediaSources[0].ETag}&videoStreamIndex=${currentVideoTrack}&audioStreamIndex=${currentAudioTrack}`,
				);
				setPosition(item.Items[0].UserData?.PlaybackPositionTicks);
				setItemName(
					item.Items[0].Type == "Episode"
						? `${item.Items[0].SeriesName} S${item.Items[0].ParentIndexNumber}:E${item.Items[0].IndexNumber} ${item.Items[0].Name}`
						: item.Items[0].Name,
				);
				setItemId(item.Items[0].Id);
				setDuration(item.Items[0].RunTimeTicks);
				// setSubtitleTracksStore(subtitleTracks);
				setSelectedSubtitleTrack(currentSubTrack);
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
				<MdiPlayOutline {...iconProps} />
			</Fab>
		);
	} else {
		return (
			<Button
				className={className}
				variant="contained"
				onClick={handleClick}
				startIcon={<MdiPlayOutline />}
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
