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
import { MdiClockOutline } from "../../icons/mdiClockOutline";
import { getRuntimeMusic } from "../../../utils/date/time";
import { MdiHeart } from "../../icons/mdiHeart";
import { MdiHeartOutline } from "../../icons/mdiHeartOutline";
import { MdiAlbum } from "../../icons/mdiAlbum";

import "./albumArtist.scss";

export const ArtistAlbum = ({ user, album, boxProps }) => {
	const albumTracks = useQuery({
		queryKey: ["artist", "album", album.Id],
		queryFn: async () => {
			const result = await getItemsApi(window.api).getItems({
				userId: user.Id,
				parentId: album.Id,
			});
			return result.data;
		},
	});

	const handleLikingTrack = async (track) => {
		let result;
		if (track.UserData.IsFavorite) {
			result = await getUserLibraryApi(window.api).unmarkFavoriteItem({
				userId: user.data.Id,
				itemId: track.Id,
			});
		} else if (!track.UserData.IsFavorite) {
			result = await getUserLibraryApi(window.api).markFavoriteItem({
				userId: user.data.Id,
				itemId: track.Id,
			});
		}
		albumTracks.refetch();
	};

	const [imgLoaded, setImgLoaded] = useState(false);

	return (
		<Box sx={{ mb: 6 }} {...boxProps}>
			<Stack direction="row" gap={3} mb={3}>
				{!!album.ImageTags?.Primary && (
					<Box
						className="album-image"
						sx={{
							aspectRatio: 1,
							borderRadius: "10px",
							overflow: "hidden",
							width: "12em",
							boxShadow: "0 0 10px rgb(0 0 0 /0.2)",
							position: "relative",
							height: "12em",
						}}
					>
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
						<Box
							className="album-image-icon-container"
							sx={{
								position: "absolute",
								width: "100%",
								height: "100%",
								top: 0,
								left: 0,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								zIndex: 1,
							}}
						>
							<MdiAlbum
								className="album-image-icon"
								sx={{ fontSize: "6em" }}
							/>
						</Box>
					</Box>
				)}
				<Stack>
					<Typography
						variant="h5"
						sx={{ opacity: `0.7`, mb: 1 }}
					>
						{album.ProductionYear}
					</Typography>
					<MuiLink
						component={Link}
						to={`/item/${album.Id}`}
						variant="h3"
						color="inherit"
						underline="hover"
					>
						{album.Name}
					</MuiLink>
				</Stack>
			</Stack>

			<TableContainer
				component={Paper}
				sx={{ mb: 2, borderRadius: "15px" }}
			>
				<Table>
					<TableHead
						sx={{
							mb: 1,
						}}
					>
						<TableRow>
							<TableCell
								sx={{
									maxWidth: 120,
									width: 20,
								}}
							>
								<Typography variant="h6">#</Typography>
							</TableCell>
							<TableCell sx={{ width: 20 }}></TableCell>
							<TableCell>
								<Typography variant="h6">
									Name
								</Typography>
							</TableCell>
							<TableCell>
								<Typography variant="h6" align="right">
									<MdiClockOutline />
								</Typography>
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{albumTracks.isSuccess &&
							albumTracks.data.Items.map(
								(mitem, mindex) => {
									return (
										<TableRow
											key={mindex}
											sx={{
												"&:last-child td, &:last-child th":
													{
														border: 0,
													},
												"&:hover": {
													background:
														"rgb(255 255 255 / 0.05)",
												},
											}}
										>
											<TableCell
												sx={{
													maxWidth: 120,
													width: 20,
												}}
											>
												<Typography variant="body1">
													{
														mitem.IndexNumber
													}
												</Typography>
											</TableCell>
											<TableCell
												sx={{
													width: 20,
												}}
												align="center"
											>
												<IconButton
													onClick={() =>
														handleLikingTrack(
															mitem,
														)
													}
												>
													{mitem.UserData
														.IsFavorite ? (
														<MdiHeart />
													) : (
														<MdiHeartOutline />
													)}
												</IconButton>
											</TableCell>
											<TableCell>
												<Typography variant="body1">
													{mitem.Name}
												</Typography>
											</TableCell>
											<TableCell align="right">
												<Typography variant="body1">
													{getRuntimeMusic(
														mitem.RunTimeTicks,
													)}
												</Typography>
											</TableCell>
										</TableRow>
									);
								},
							)}
					</TableBody>
				</Table>
			</TableContainer>
		</Box>
	);
};
