/** @format */
import { useState } from "react";
import PropTypes from "prop-types";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import MuiLink from "@mui/material/Link";

import { Link } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";

import { getRuntimeMusic } from "../../../utils/date/time";

import { MdiClockOutline } from "../../icons/mdiClockOutline";
import { MdiHeart } from "../../icons/mdiHeart";
import { MdiHeartOutline } from "../../icons/mdiHeartOutline";
import { MdiAlbum } from "../../icons/mdiAlbum";

import "./albumArtist.scss";
import { useAudioPlayback } from "../../../utils/store/audioPlayback";
import LikeButton from "../../buttons/likeButton";
import { SortOrder } from "@jellyfin/sdk/lib/generated-client";

export const ArtistAlbum = ({ user, album, boxProps }) => {
	const albumTracks = useQuery({
		queryKey: ["artist", "album", album.Id],
		queryFn: async () => {
			const result = await getItemsApi(window.api).getItems({
				userId: user.Id,
				parentId: album.Id,
				sortOrder: SortOrder.Ascending,
				sortBy: "IndexNumber",
			});
			return result.data;
		},

		networkMode: "always",
	});

	const handleLikingTrack = async (track) => {
		let result;
		if (track.UserData.IsFavorite) {
			result = await getUserLibraryApi(window.api).unmarkFavoriteItem({
				userId: user.Id,
				itemId: track.Id,
			});
		} else if (!track.UserData.IsFavorite) {
			result = await getUserLibraryApi(window.api).markFavoriteItem({
				userId: user.Id,
				itemId: track.Id,
			});
		}
		albumTracks.refetch();
	};

	const [imgLoaded, setImgLoaded] = useState(false);

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
			`${window.api.basePath}/Audio/${albumTracks.data.Items[index].Id}/universal?deviceId=${window.api.deviceInfo.id}&userId=${user.Id}&api_key=${window.api.accessToken}`,
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
							src={`${window.api.basePath}/Items/${album.Id}/Images/Primary?fillHeight=532&fillWidth=532&quality=96`}
							style={{
								width: "100%",
								height: "100%",
								objectFit: "cover",
								opacity: imgLoaded ? 1 : 0,
								transition: "opacity 250ms",
								position: "relative",
								zIndex: 2,
							}}
							onLoad={() => setImgLoaded(true)}
						/>
						<div className="album-image-icon-container">
							<MdiAlbum
								className="album-image-icon"
								sx={{ fontSize: "6em" }}
							/>
						</div>
					</div>
				)}
				<Stack>
					<Typography
						variant="h5"
						style={{ opacity: `0.6`, mb: 1 }}
					>
						{album.ProductionYear}
					</Typography>
					<MuiLink
						component={Link}
						to={`/musicalbum/${album.Id}`}
						variant="h3"
						color="inherit"
						underline="hover"
					>
						{album.Name}
					</MuiLink>
				</Stack>
			</div>

			{albumTracks.isSuccess && (
				<Paper
					className="item-detail-album-tracks"
					style={{
						marginBottom: "1.2em",
					}}
				>
					<div
						key={0}
						className="item-detail-album-track"
						style={{
							padding: "0.75em 0 ",
							background: "rgb(255 255 255 / 0.1)",
							boxShadow: "0 0 10px rgb(0 0 0 / 0.5)",
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
						<div></div>
						<Typography
							variant="h6"
							style={{
								justifySelf: "start",
							}}
							fontWeight={400}
						>
							Name
						</Typography>
						<MdiClockOutline />
					</div>
					{albumTracks.data.Items.map((track, index) => {
						return (
							<div
								key={track.Id}
								className={
									currentTrackItem.Id == track.Id &&
									currentTrackItem.ParentId ==
										track.ParentId
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
									{!!track.IndexNumber
										? track.IndexNumber
										: "-"}
								</Typography>

								<LikeButton
									itemId={track.Id}
									isFavorite={
										track.UserData?.IsFavorite
									}
									queryKey={[
										"artist",
										"album",
										album.Id,
									]}
									userId={user.Id}
									itemName={track.Name}
									color={
										currentTrackItem.Id ==
											track.Id &&
										currentTrackItem.ParentId ==
											track.ParentId
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
									{track.AlbumArtist ==
										"Various Artists" && (
										<Typography
											variant="subtitle2"
											style={{
												opacity: 0.5,
											}}
										>
											{track.ArtistItems.map(
												(artist) =>
													artist.Name,
											).join(", ")}
										</Typography>
									)}
								</div>
								<Typography variant="subtitle1">
									{getRuntimeMusic(
										track.RunTimeTicks,
									)}
								</Typography>
							</div>
						);
					})}
				</Paper>
			)}
		</div>
	);
};
