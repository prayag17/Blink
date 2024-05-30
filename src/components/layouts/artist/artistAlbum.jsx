import React, { useState } from "react";

import MuiLink from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { useQuery } from "@tanstack/react-query";

import { getRuntimeMusic } from "../../../utils/date/time";

import { SortOrder } from "@jellyfin/sdk/lib/generated-client";
import { useAudioPlayback } from "../../../utils/store/audioPlayback";
import LikeButton from "../../buttons/likeButton";
import PlayButton from "../../buttons/playButton";

import TrackList from "../tracksList/index";
import "./albumArtist.scss";
import { useApiInContext } from "@/utils/store/api";
import { Link, useRouteContext } from "@tanstack/react-router";

export const ArtistAlbum = ({ user, album, boxProps }) => {
	const api = useApiInContext((s) => s.api);
	const albumTracks = useQuery({
		queryKey: ["artist", "album", album.Id],
		queryFn: async () => {
			const result = await getItemsApi(api).getItems({
				userId: user.Id,
				parentId: album.Id,
				sortOrder: SortOrder.Ascending,
				sortBy: "IndexNumber",
			});
			return result.data;
		},

		networkMode: "always",
	});

	const [
		currentTrackItem,
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
	const playTrack = (index) => {
		setAudioTracks(albumTracks.data.Items);
		setCurrentAudioTrack(index);
		setAudioUrl(
			`${api.basePath}/Audio/${albumTracks.data.Items[index].Id}/universal?deviceId=${api.deviceInfo.id}&userId=${user.Id}&api_key=${api.accessToken}`,
		);
		setAudioItem(albumTracks.data.Items[index]);
		setAudioDisplay(true);
	};

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
							alt={album.Name}
							src={`${api.basePath}/Items/${album.Id}/Images/Primary?fillHeight=532&fillWidth=532&quality=96`}
							style={{
								width: "100%",
								height: "100%",
								objectFit: "cover",
								opacity: 0,
								transition: "opacity 250ms",
								position: "relative",
								zIndex: 2,
							}}
							onLoad={(e) => (e.currentTarget.style.opacity = 1)}
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
							variant="h4"
							fontWeight={300}
							style={{ opacity: "0.6", mb: 1 }}
						>
							{album.ProductionYear}
						</Typography>
						<MuiLink
							component={Link}
							to="/album/$Id"
							variant="h2"
							color="inherit"
							underline="hover"
						>
							{album.Name}
						</MuiLink>
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
							itemId={album.Id}
							itemType={album.Type}
							itemUserData={album.UserData}
							userId={user.Id}
							buttonProps={{
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
								album.ParentBackdropItemId,
								"artist",
								"discography",
							]}
							isFavorite={album.UserData.IsFavorite}
							itemId={album.Id}
							itemType={album.Type}
							itemUserData={album.UserData}
							userId={user.Id}
						/>
					</div>
				</div>
			</div>

			{albumTracks.isSuccess && (
				<TrackList user={user} tracks={albumTracks.data.Items} />
			)}
		</div>
	);
};

{
	/* <div
						key={0}
						className="item-detail-album-track"
						style={{
							padding: "0.75em 0 ",
							background: "rgb(0 0 0 / 0.6)",
						}}
					>
						<Typography
							variant="h6"
							fontWeight={400}
							style={{
								justifySelf: "end",
							}}
						>
							#
						</Typography>
						<div />
						<Typography
							variant="h6"
							style={{
								justifySelf: "start",
							}}
							fontWeight={400}
						>
							Name
						</Typography>
						<span className="material-symbols-rounded">schedule</span>
					</div> 
					{/*albumTracks.data.Items.map((track, index) => {
						return (
							<div
								key={track.Id}
								className={
									currentTrackItem.Id === track.Id &&
									currentTrackItem.ParentId === track.ParentId
										? "item-detail-album-track playing"
										: "item-detail-album-track"
								}
								onClick={() => playTrack(index)}
							>
								<Typography
									variant="subtitle1"
									style={{
										justifySelf: "end",
									}}
								>
									{track.IndexNumber ? track.IndexNumber : "-"}
								</Typography>

								<LikeButton
									itemId={track.Id}
									isFavorite={track.UserData?.IsFavorite}
									queryKey={["artist", "album", album.Id]}
									userId={user.Id}
									itemName={track.Name}
									color={
										currentTrackItem.Id === track.Id &&
										currentTrackItem.ParentId === track.ParentId
											? "hsl(337, 96%, 56%)"
											: "white"
									}
								/>

								<div
									style={{
										display: "flex",
										flexDirection: "column",
										width: "100%",
									}}
								>
									<Typography
										variant="subtitle1"
										style={{
											justifySelf: "start",
										}}
										fontWeight={500}
									>
										{track.Name}
									</Typography>
									{track.AlbumArtist === "Various Artists" && (
										<Typography
											variant="subtitle2"
											style={{
												opacity: 0.5,
											}}
										>
											{track.ArtistItems.map((artist) => artist.Name).join(
												", ",
											)}
										</Typography>
									)}
								</div>
								<Typography variant="subtitle1">
									{getRuntimeMusic(track.RunTimeTicks)}
								</Typography>
							</div>
						);
					})*/
}
