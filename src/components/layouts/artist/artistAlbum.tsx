import React from "react";

import Typography from "@mui/material/Typography";

import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { useQuery } from "@tanstack/react-query";

import {
	type BaseItemDto,
	SortOrder,
	type UserDto,
} from "@jellyfin/sdk/lib/generated-client";
import LikeButton from "../../buttons/likeButton";
import PlayButton from "../../buttons/playButton";

import "./albumArtist.scss";
import AlbumMusicTrack from "@/components/albumMusicTrack";
import { useApiInContext } from "@/utils/store/api";
import { Link } from "@tanstack/react-router";

type ArtistAlbumProps = {
	user: UserDto;
	album: BaseItemDto;
	boxProps?: object;
};

export const ArtistAlbum = ({ user, album, boxProps }: ArtistAlbumProps) => {
	const api = useApiInContext((s) => s.api);
	const albumTracks = useQuery({
		queryKey: ["artist", "album", album.Id],
		queryFn: async () => {
			if (!api) return null;
			const result = await getItemsApi(api).getItems({
				userId: user.Id,
				parentId: album.Id,
				sortOrder: [SortOrder.Ascending],
				sortBy: ["IndexNumber"],
			});
			return result.data;
		},

		networkMode: "always",
	});

	return (
		<div style={{ marginBottom: "3em" }} {...boxProps}>
			<div
				style={{
					display: "flex",
					flexDirection: "row",
					gap: "1em",
					marginBottom: "1em",
				}}
			>
				{!!album.ImageTags?.Primary && (
					<div className="album-image">
						<img
							alt={album.Name ?? "Album Image"}
							src={`${api?.basePath}/Items/${album.Id}/Images/Primary?fillHeight=532&fillWidth=532&quality=96`}
							style={{
								width: "100%",
								height: "100%",
								objectFit: "cover",
								opacity: 0,
								transition: "opacity 250ms",
								position: "relative",
								zIndex: 2,
							}}
							onLoad={(e) => {
								e.currentTarget.style.opacity = "1";
							}}
						/>
						<div className="album-image-icon-container">
							<span
								className="material-symbols-rounded album-image-icon"
								style={{ fontSize: "8em" }}
							>
								album
							</span>
						</div>
					</div>
				)}
				<div
					className="flex flex-column"
					style={{
						alignItems: "flex-start",
						justifyContent: "space-between",
						padding: "1em 0",
					}}
				>
					<div className="flex flex-column">
						<Typography
							variant="h5"
							fontWeight={300}
							style={{ opacity: "0.6" }}
						>
							{album.ProductionYear}
						</Typography>
						<Link
							to="/album/$id"
							params={{ id: album.Id ?? "" }}
							style={{ color: "white", textDecoration: "none" }}
						>
							<Typography variant="h4" color="white">
								{album.Name}
							</Typography>
						</Link>
					</div>
					<div
						className=" flex flex-row"
						style={{
							gap: "1em",
							alignItems: "center",
						}}
					>
						<PlayButton
							audio
							item={album}
							itemType={album.Type ?? "MusicAlbum"}
							userId={user.Id}
							buttonProps={{
								//@ts-ignore
								color: "white",
								style: {
									color: "black ",
								},
							}}
						/>

						<LikeButton
							itemName={album.Name}
							key={album.Id}
							queryKey={[
								"item",
								album.ParentBackdropItemId ?? "",
								"artist",
								"discography",
							]}
							isFavorite={album.UserData?.IsFavorite}
							itemId={album.Id}
							userId={user.Id}
						/>
					</div>
				</div>
			</div>

			{albumTracks.isSuccess && (albumTracks.data?.Items?.length ?? 0) > 0 && (
				<div>
					<div className="item-info-track header">
						<span className="material-symbols-rounded index">tag</span>
						<Typography variant="subtitle1">Title</Typography>
						<Typography variant="subtitle1">Duration</Typography>
					</div>
					{albumTracks.data?.Items?.map((track, index) => (
						<AlbumMusicTrack
							track={track}
							trackIndex={index}
							musicTracks={albumTracks.data}
							key={track.Id}
						/>
					))}
				</div>
			)}
		</div>
	);
};
