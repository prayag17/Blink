import Typography from "@mui/material/Typography";
import React from "react";
import { getRuntimeMusic } from "../../utils/date/time";
import { useAudioPlayback } from "../../utils/store/audioPlayback";
import LikeButton from "../buttons/likeButton";
import PlayButton from "../buttons/playButton";
import "./musicTrack.scss";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import { useApiInContext } from "@/utils/store/api";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import { Link } from "@tanstack/react-router";
import lyrics_icon from "../../assets/icons/lyrics.svg";

/**
 * @description Music Track element displayed in ArtistTitlePage and Songs library
 */
const MusicTrack = ({
	item,
	queryKey,
	userId,
	playlistItem = false,
	playlistItemId,
	trackIndex,
	className = "",
}: {
	item: BaseItemDto;
	queryKey: string[];
	userId?: string | undefined;
	playlistItem?: boolean;
	playlistItemId?: string;
	trackIndex?: number;
	className?: string;
}) => {
	const api = useApiInContext((s) => s.api);
	const [currentTrackItem] = useAudioPlayback((state) => [state.item]);

	return (
		<div className={`music-track ${className}`}>
			<div className="music-track-image">
				<div className="music-track-icon">
					<span
						className="material-symbols-rounded"
						style={{ fontSize: "2em !important" }}
					>
						music_note
					</span>
				</div>
				<img
					alt={item.Name ?? "Music Track"}
					src={
						api &&
						getImageUrlsApi(api).getItemImageUrlById(
							(Object.keys(item.ImageTags ?? {}).length === 0
								? item.AlbumId
								: item.Id) ?? "",
							"Primary",
							{
								quality: 70,
								fillHeight: 128,
								fillWidth: 128,
							},
						)
					}
					style={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
						opacity: 0,
					}}
					onLoad={(e) => {
						e.currentTarget.style.opacity = "1";
					}}
				/>
				<div className="music-track-image-overlay">
					<PlayButton
						item={item}
						itemType="Audio"
						userId={userId}
						size="small"
						iconOnly
						audio
						playlistItem={playlistItem}
						playlistItemId={playlistItemId}
						trackIndex={trackIndex}
					/>
				</div>
			</div>
			<div className="music-track-info">
				<Typography
					variant="subtitle1"
					style={{
						color:
							item.Id === currentTrackItem?.Id ? "hsl(337, 96%, 56%)" : "white",
					}}
				>
					{item.Name}
				</Typography>

				<div
					style={{
						display: "flex",
						opacity: 0.8,
					}}
				>
					{item.HasLyrics && (
						<img
							src={lyrics_icon}
							alt="Lyrics"
							className="music-track-info-lyrics"
						/>
					)}
					{item.ArtistItems?.map((artist, index) => (
						<span
							style={{ display: "inline-flex", alignItems: "center" }}
							key={artist.Id}
						>
							<Typography
								variant="subtitle2"
								fontWeight="400"
								style={{
									textDecoration: "none",
								}}
							>
								<Link
									style={{ textDecoration: "none", color: "white" }}
									to="/artist/$id"
									params={{ id: artist.Id ?? "" }}
								>
									{artist.Name}
								</Link>
							</Typography>
							{index !== (item.ArtistItems?.length ?? 0) - 1 && (
								<span
									style={{
										whiteSpace: "pre",
									}}
								>
									,{" "}
								</span>
							)}
						</span>
					))}
				</div>
			</div>
			<Typography variant="subtitle1">
				{getRuntimeMusic(item.RunTimeTicks ?? 0)}
			</Typography>
			<LikeButton
				itemId={item.Id}
				isFavorite={item.UserData?.IsFavorite}
				queryKey={queryKey}
				userId={userId}
				itemName={item.Name}
			/>
		</div>
	);
};

export default MusicTrack;
