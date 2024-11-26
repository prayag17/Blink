import {
	generateAudioStreamUrl,
	playAudio,
	useAudioPlayback,
} from "@/utils/store/audioPlayback";
import type {
	BaseItemDto,
	BaseItemDtoQueryResult,
} from "@jellyfin/sdk/lib/generated-client";
import { Typography } from "@mui/material";
import React from "react";

import { getRuntimeMusic } from "@/utils/date/time";
import { useApiInContext } from "@/utils/store/api";
import { useCentralStore } from "@/utils/store/central";
import { setQueue } from "@/utils/store/queue";
import { useSnackbar } from "notistack";
import lyricsIcon from "../../assets/icons/lyrics.svg";
import LikeButton from "../buttons/likeButton";

import "./albumMusicTrack.scss";

type AlbumMusicTrackProps = {
	track: BaseItemDto;
	/**
	 * This is the index of the track in the musicTracks array (not to be confused with IndexNumber property of the track)
	 */
	trackIndex: number;
	musicTracks: BaseItemDtoQueryResult | null;
};

export default function AlbumMusicTrack(props: AlbumMusicTrackProps) {
	const { track, musicTracks, trackIndex } = props;
	const [currentPlayingItem] = useAudioPlayback((state) => [state.item]);

	const user = useCentralStore((state) => state.currentUser);
	const api = useApiInContext((s) => s.api);

	const { enqueueSnackbar } = useSnackbar();

	const handlePlayback = (
		index: number,
		item: BaseItemDto,
		queue: BaseItemDto[],
	) => {
		if (!user?.Id || !api) {
			console.error("User not logged in");
			enqueueSnackbar("You need to be logged in to play music", {
				variant: "error",
			});
			return;
		}
		if (item.Id) {
			const url = generateAudioStreamUrl(
				item.Id,
				user.Id,
				api.deviceInfo.id,
				api.basePath,
				api.accessToken,
			);
			playAudio(url, item);
			setQueue(queue, index);
		}
	};
	return (
		<div
			className={
				currentPlayingItem?.Id === track.Id
					? "item-info-track playing"
					: "item-info-track"
			}
			key={track.Id}
			onClick={() => {
				if (musicTracks?.Items) {
					handlePlayback(trackIndex, track, musicTracks.Items);
				}
			}}
		>
			<div className="index-container">
				<span className="material-symbols-rounded fill ">play_arrow</span>
				<Typography className="index">{track.IndexNumber ?? "-"}</Typography>
			</div>
			<div className="item-info-track-info">
				<Typography className="item-info-track-info-name">
					{track.Name}
				</Typography>
				<Typography
					variant="subtitle2"
					style={{
						opacity: 0.6,
						display: "flex",
						alignItems: "center",
						gap: "0.6em",
					}}
					fontWeight={300}
				>
					{track.HasLyrics && <img src={lyricsIcon} alt="lyrics" />}
					{track.Artists?.join(", ")}
				</Typography>
			</div>
			<Typography>{getRuntimeMusic(track.RunTimeTicks ?? 0)}</Typography>
			<div className="flex flex-align-center">
				<LikeButton
					itemId={track.Id}
					isFavorite={track.UserData?.IsFavorite}
					queryKey={["item", "musicTracks"]}
					userId={user?.Id}
					itemName={track.Name}
				/>
			</div>
		</div>
	);
}