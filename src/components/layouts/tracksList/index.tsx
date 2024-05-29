import Typography from "@mui/material/Typography";
import React from "react";

// Types
import type { BaseItemDto, UserDto } from "@jellyfin/sdk/lib/generated-client";

import { getRuntimeMusic } from "../../../utils/date/time";
import { useAudioPlayback } from "../../../utils/store/audioPlayback";
import LikeButton from "../../buttons/likeButton";
import "./tracksList.scss";
import { useApiInContext } from "@/utils/store/api";
import { useRouteContext } from "@tanstack/react-router";

export default function TracksList({
	tracks,
	user,
	queryKey,
}: { tracks: BaseItemDto[]; user: UserDto; queryKey: [] }) {
	const api = useApiInContext((s) => s.api);

	const [
		currentItem,
		setCurrentAudioTrack,
		setAudioUrl,
		setAudioDisplay,
		setAudioItem,
		setAudioTracks,
	] = useAudioPlayback((state) => [
		state.item,
		state.setCurrentTrack,
		state.setUrl,
		state.setDisplay,
		state.setItem,
		state.setTracks,
	]);
	const playTrack = (index: number) => {
		setAudioTracks(tracks);
		setCurrentAudioTrack(index);
		setAudioUrl(
			`${api.basePath}/Audio/${tracks[index].Id}/universal?deviceId=${api.deviceInfo.id}&userId=${user.Id}&api_key=${api.accessToken}`,
		);
		setAudioItem(tracks[index]);
		setAudioDisplay(true);
	};
	return (
		<div className="track-list">
			<div className="track track-header">
				<Typography variant="h6">#</Typography>
				<div>{""}</div>
				<Typography
					variant="h6"
					style={{
						width: "100%",
					}}
				>
					Name
				</Typography>
				<span className="material-symbols-rounded">schedule</span>
			</div>
			{tracks.map((track, index) => (
				<div
					className={currentItem?.Id === track.Id ? "track playing" : "track"}
					key={track.Id}
					onClick={() => playTrack(index)}
				>
					{currentItem?.Id === track.Id ? (
						<span className="material-symbols-rounded ">equalizer</span>
					) : (
						<Typography>{track.IndexNumber ?? "-"}</Typography>
					)}
					<LikeButton
						itemId={track.Id}
						isFavorite={track.UserData?.IsFavorite}
						queryKey={queryKey}
						userId={user.Id}
						itemName={track.Name}
					/>
					<Typography
						style={{
							width: "100%",
						}}
					>
						{track.Name}
					</Typography>
					<Typography>{getRuntimeMusic(track?.RunTimeTicks)}</Typography>
				</div>
			))}
		</div>
	);
}
