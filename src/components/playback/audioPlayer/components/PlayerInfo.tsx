import type { Api } from "@jellyfin/sdk";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import React from "react";
import LikeButton from "@/components/buttons/likeButton";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import { getItemQueryOptions } from "@/utils/queries/items";
import { useCentralStore } from "@/utils/store/central";

interface PlayerInfoProps {
	item: BaseItemDto | undefined | null;
	api: Api | undefined;
	/** Opens the full-screen player. */
	onOpen: () => void;
}

const PlayerInfo = ({ item, api, onOpen }: PlayerInfoProps) => {
	const user = useCentralStore((s) => s.currentUser);
	// Fresh user data so the like button reflects changes immediately.
	const itemDetails = useQuery({
		...getItemQueryOptions(item?.Id ?? "", api, user?.Id),
		enabled: Boolean(item?.Id && api && user?.Id),
	});

	if (!api || !item) return null;

	const artists = item.ArtistItems?.length
		? item.ArtistItems
		: (item.AlbumArtists ?? []);

	return (
		<div className="audio-player-info">
			<button
				type="button"
				className="audio-player-image-container"
				onClick={onOpen}
				aria-label="Open player"
			>
				<span className="material-symbols-rounded audio-player-image-icon">
					music_note
				</span>
				<img
					alt=""
					className="audio-player-image"
					src={getImageUrlsApi(api).getItemImageUrlById(
						(!item.ImageTags?.Primary ? item.AlbumId : item.Id) ?? "",
						"Primary",
						{ quality: 85, fillHeight: 120, fillWidth: 120 },
					)}
				/>
				<span className="material-symbols-rounded audio-player-image-expand">
					expand_less
				</span>
			</button>
			<div className="audio-player-info-text">
				<Typography
					variant="subtitle2"
					component="button"
					className="audio-player-info-title"
					title={item.Name ?? undefined}
					onClick={onOpen}
				>
					{item.Name}
				</Typography>
				<Typography
					variant="caption"
					noWrap
					className="audio-player-info-artist"
				>
					{artists.map((artist, index) => (
						<React.Fragment key={artist.Id ?? artist.Name}>
							{index > 0 && ", "}
							{artist.Id ? (
								<Link to="/music/artist/$id" params={{ id: artist.Id }}>
									{artist.Name}
								</Link>
							) : (
								artist.Name
							)}
						</React.Fragment>
					))}
				</Typography>
			</div>
			<LikeButton
				itemId={item.Id ?? undefined}
				itemName={item.Name}
				isFavorite={
					itemDetails.data?.UserData?.IsFavorite ?? item.UserData?.IsFavorite
				}
				queryKey={["item", item.Id ?? ""]}
				userId={user?.Id}
			/>
		</div>
	);
};

export default PlayerInfo;
