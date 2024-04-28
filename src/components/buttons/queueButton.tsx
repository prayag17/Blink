import { Divider, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import React, { useState } from "react";
import { useApi } from "src/utils/store/api";
import { playItem, usePlaybackStore } from "src/utils/store/playback";
import useQueue from "src/utils/store/queue";
import { getTypeIcon } from "../utils/iconsCollection";

import type { BaseItemKind } from "@jellyfin/sdk/lib/generated-client";
import { getMediaInfoApi } from "@jellyfin/sdk/lib/utils/api/media-info-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { useMutation, useQuery } from "@tanstack/react-query";
import playbackProfile from "src/utils/playback-profiles";
import "./queueButton.scss";
const QueueButton = () => {
	const [api] = useApi((state) => [state.api]);
	const [queueItems, currentItemIndex] = useQueue((state) => [
		state.tracks,
		state.currentItemIndex,
	]);

	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			const result = await getUserApi(api).getCurrentUser();
			return result.data;
		},
	});
	const [buttonEl, setButtonEl] = useState(null);

	const handlePlay = useMutation({
		mutationKey: ["handlePlayIndex"],
		mutationFn: async ({
			index,
			type,
		}: { index: number; type: BaseItemKind }) => {
			const item = queueItems[index];
			// console.log(index);
			const mediaInfo = await getMediaInfoApi(api).getPostedPlaybackInfo({
				audioStreamIndex: item.MediaSources[0].DefaultAudioStreamIndex ?? 0,
				subtitleStreamIndex:
					item.MediaSources[0].DefaultSubtitleStreamIndex ?? 0,
				itemId: item.Id,
				startTimeTicks: item.UserData?.PlaybackPositionTicks,
				userId: user.data?.Id,
				mediaSourceId: item.MediaSources[0].Id,
				playbackInfoDto: {
					DeviceProfile: playbackProfile,
				},
			});
			return { item, mediaInfo: mediaInfo.data, index };
		},
		onSuccess: (result) => {
			let itemName = result.item.Name;
			let episodeTitle = "";
			if (result?.item.SeriesId) {
				itemName = result?.item.SeriesName;
				episodeTitle = `S${result?.item.ParentIndexNumber ?? 0}:E${
					result?.item.IndexNumber ?? 0
				} ${result?.item.Name}`;
			}

			// Select correct subtitle track, this is useful if item is played with playbutton from card since that does not provide coorect default subtitle track index.
			let selectedSubtitleTrack: number | "nosub" | undefined = -1;
			const subtitles = result?.mediaInfo.MediaSources[0].MediaStreams?.filter(
				(value) => value.Type === "Subtitle",
			);
			let enableSubtitles = true;
			if (result.mediaInfo.MediaSources[0].DefaultSubtitleStreamIndex) {
				selectedSubtitleTrack =
					result.mediaInfo.MediaSources[0].DefaultSubtitleStreamIndex;
			} else if (subtitles?.length > 0) {
				selectedSubtitleTrack = subtitles[0].Index;
			} else {
				enableSubtitles = false;
			}
			const videoTrack = result?.mediaInfo.MediaSources[0].MediaStreams?.filter(
				(value) => value.Type === "Subtitle",
			);

			const urlOptions = {
				Static: true,
				tag: result?.mediaInfo.MediaSources[0].ETag,
				mediaSourceId: result?.mediaInfo.MediaSources[0].Id,
				deviceId: api?.deviceInfo.id,
				api_key: api?.accessToken,
			};

			const urlParams = new URLSearchParams(urlOptions).toString();
			let playbackUrl = `${api?.basePath}/Videos/${result?.mediaInfo.MediaSources[0].Id}/stream.${result?.mediaInfo.MediaSources[0].Container}?${urlParams}`;

			if (
				result?.mediaInfo.MediaSources[0].SupportsTranscoding &&
				result?.mediaInfo.MediaSources[0].TranscodingUrl
			) {
				playbackUrl = `${api.basePath}${result.mediaInfo.MediaSources[0].TranscodingUrl}`;
			} else if (result?.mediaInfo.MediaSources[0].hlsStream) {
				playbackUrl = result.mediaInfo.MediaSources[0].hlsStream;
			}
			playItem(
				itemName,
				episodeTitle,
				videoTrack[0].Index,
				result.mediaInfo.MediaSources[0].DefaultAudioStreamIndex ?? 0,
				selectedSubtitleTrack,
				result?.mediaInfo?.MediaSources[0].Container ?? "mkv",
				enableSubtitles,
				playbackUrl,
				user.data.Id,
				result.item.UserData?.PlaybackPositionTicks,
				result.item.RunTimeTicks,
				result.item,
				queueItems,
				result.index,
				subtitles,
				result?.mediaInfo.MediaSources[0].Id,
				result?.mediaInfo.PlaySessionId,
			);
			setButtonEl(null);
		},
		onError: (error) => {
			console.error(error);
		},
	});

	return (
		<>
			<Menu
				open={Boolean(buttonEl)}
				onClose={() => setButtonEl(null)}
				anchorEl={buttonEl}
				anchorOrigin={{
					vertical: "top",
					horizontal: "center",
				}}
				transformOrigin={{
					vertical: "bottom",
					horizontal: "center",
				}}
			>
				{queueItems.map((item, index) => (
					<MenuItem
						className="queue-item"
						key={item.Id}
						disabled={index === currentItemIndex}
						onClick={() => handlePlay.mutate({ index, type: item.Type })}
					>
						<Typography variant="subtitle2">
							{item.IndexNumberEnd
								? `S${item.ParentIndexNumber}:E${item.IndexNumber} / ${item.IndexNumberEnd}`
								: `S${item.ParentIndexNumber}:E${item.IndexNumber}`}
						</Typography>
						<div className="queue-item-image-container">
							{item.ImageTags.Primary ? (
								<img
									className="queue-item-image"
									src={api?.getItemImageUrl(item?.Id, "Primary", {
										tag: item.ImageTags?.Primary,
									})}
									alt={item.Name}
								/>
							) : (
								<div className="queue-item-image-icon">
									{getTypeIcon(item.Type)}
								</div>
							)}
							{index === currentItemIndex && (
								<span
									className="material-symbols-rounded"
									style={{
										position: "absolute",
										top: "50%",
										left: "50%",
										transform: "translate(-50%,-50%)",
										fontSize: "2em",
										"--wght": "100",
									}}
								>
									equalizer
								</span>
							)}
						</div>
						<div className="queue-item-info">
							{item.SeriesName ? (
								<>
									<Typography variant="subtitle1" width="100%">
										{item.SeriesName}
									</Typography>
									<Typography
										variant="subtitle2"
										width="100%"
										style={{ opacity: 0.6 }}
									>
										{item.Name}
									</Typography>
								</>
							) : (
								<Typography variant="subtitle1" width="100%">
									{item.Name}
								</Typography>
							)}
						</div>
					</MenuItem>
				))}
			</Menu>
			<IconButton onClick={(e) => setButtonEl(e.currentTarget)}>
				<span className="material-symbols-rounded">playlist_play</span>
			</IconButton>
		</>
	);
};

export default QueueButton;