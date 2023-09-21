/** @format */
import Typography from "@mui/material/Typography";
import "./musicTrack.module.scss";
import { getRuntimeMusic } from "../../utils/date/time";
import LikeButton from "../buttons/likeButton";
import TextLink from "../textLink";
import PlayButton from "../buttons/playButton";
import { useAudioPlayback } from "../../utils/store/audioPlayback";

/**
 * @typedef {Object} Props
 * @property {import("@jellyfin/sdk/lib/generated-client/models").BaseItemDto} item
 * @property {Array} queryKey
 * @property {string} userId
 * @property {bool} playlistItem
 * @property {string | undefined} playlistItemId
 */

/**
 * @description Music Track element displayed in ArtistTitlePage and Songs library
 * @param {Props}
 * @returns {React.Component}
 */

const MusicTrack = ({
	item,
	queryKey,
	userId,
	playlistItem = false,
	playlistItemId,
	className = "",
}) => {
	const [currentTrackItem] = useAudioPlayback((state) => [state.item]);

	return (
		<div className={`music-track ${className}`}>
			<div className="music-track-image">
				<img
					src={window.api.getItemImageUrl(
						Object.keys(item.ImageTags).length == 0
							? item.AlbumId
							: item.Id,
						"Primary",
						{
							quality: 70,
							fillHeight: 128,
							fillWidth: 128,
						},
					)}
					style={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
						opacity: 0,
					}}
					onLoad={(e) => (e.target.style.opacity = 1)}
				/>
				<div className="music-track-image-overlay">
					<PlayButton
						itemId={item.Id}
						userId={userId}
						itemType={item.Type}
						size="small"
						iconOnly
						audio
						playlistItem={playlistItem}
						playlistItemId={playlistItemId}
					/>
				</div>
			</div>
			<div className="music-track-info">
				<Typography
					variant="subtitle1"
					style={{
						color:
							item.Id == currentTrackItem.Id
								? "hsl(337, 96%, 56%)"
								: "white",
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
					{item.ArtistItems.map((artist, index) => (
						<>
							<TextLink
								text={artist.Name}
								variant={"subtitle2"}
								location={`/artist/${artist.Id}`}
								otherProps={{
									fontWeight: 400,
								}}
							/>
							{index != item.ArtistItems.length - 1 && (
								<span
									style={{
										whiteSpace: "pre",
									}}
								>
									,{" "}
								</span>
							)}
						</>
					))}
				</div>
				{/* <Typography
					variant="subtitle2"
					style={{
						opacity: 0.5,
					}}
				>
					{item.Name}
				</Typography> */}
			</div>
			<Typography variant="subtitl1">
				{getRuntimeMusic(item.RunTimeTicks)}
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
