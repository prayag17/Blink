/** @format */
import { useState, useEffect } from "react";
import PropTypes from "prop-types";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import { IconButton, useTheme } from "@mui/material";

import { useParams, useNavigate } from "react-router-dom";

import {
	BaseItemKind,
	ItemFields,
	SortOrder,
} from "@jellyfin/sdk/lib/generated-client";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
import { getLibraryApi } from "@jellyfin/sdk/lib/utils/api/library-api";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";

import { useQuery } from "@tanstack/react-query";
import { MdiClockOutline } from "../../components/icons/mdiClockOutline";

import { getRuntimeMusic, getRuntimeFull, endsAt } from "../../utils/date/time";

import Hero from "../../components/layouts/item/hero";
import { Card } from "../../components/card/card";
import { CardScroller } from "../../components/cardScroller/cardScroller";

import "./album.module.scss";
import { ErrorNotice } from "../../components/notices/errorNotice/errorNotice";
import { useBackdropStore } from "../../utils/store/backdrop";
import LikeButton from "../../components/buttons/likeButton";
import { MdiPlayOutline } from "../../components/icons/mdiPlayOutline";
import { useAudioPlayback } from "../../utils/store/audioPlayback";
function TabPanel(props) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`full-width-tabpanel-${index}`}
			aria-labelledby={`full-width-tab-${index}`}
			{...other}
			style={{ marginTop: "1em" }}
		>
			{value === index && <Box>{children}</Box>}
		</div>
	);
}

TabPanel.propTypes = {
	children: PropTypes.node,
	index: PropTypes.number.isRequired,
	value: PropTypes.number.isRequired,
};

function a11yProps(index) {
	return {
		id: `full-width-tab-${index}`,
		"aria-controls": `full-width-tabpanel-${index}`,
	};
}

const MusicAlbumTitlePage = () => {
	const { id } = useParams();

	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			let usr = await getUserApi(window.api).getCurrentUser();
			return usr.data;
		},
		networkMode: "always",
	});

	const item = useQuery({
		queryKey: ["item", id],
		queryFn: async () => {
			const result = await getUserLibraryApi(window.api).getItem({
				userId: user.data.Id,
				itemId: id,
				fields: [ItemFields.Crew],
			});
			return result.data;
		},
		enabled: !!user.data,
		networkMode: "always",
		refetchOnWindowFocus: true,
	});

	const similarItems = useQuery({
		queryKey: ["item", id, "similarItem"],
		queryFn: async () => {
			let result = await getLibraryApi(window.api).getSimilarAlbums({
				userId: user.data.Id,
				itemId: item.data.Id,
			});
			return result.data;
		},
		enabled: item.isSuccess,
		networkMode: "always",
		refetchOnWindowFocus: true,
	});

	const musicTracks = useQuery({
		queryKey: ["item", id, "musicTracks"],
		queryFn: async () => {
			const result = await getItemsApi(window.api).getItems({
				userId: user.data.Id,
				parentId: item.data.Id,
				sortOrder: SortOrder.Ascending,
				sortBy: "IndexNumber",
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data.Type == BaseItemKind.MusicAlbum,
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
		setAudioTracks(musicTracks.data.Items);
		setCurrentAudioTrack(index);
		setAudioUrl(
			`${window.api.basePath}/Audio/${musicTracks.data.Items[index].Id}/universal?deviceId=${window.api.deviceInfo.id}&userId=${user.data.Id}&api_key=${window.api.accessToken}`,
		);
		setAudioItem(musicTracks.data.Items[index]);
		setAudioDisplay(true);
	};

	const [setAppBackdrop] = useBackdropStore((state) => [state.setBackdrop]);

	useEffect(() => {
		if (item.isSuccess) {
			setAppBackdrop(
				item.data.Type === BaseItemKind.MusicAlbum ||
					item.data.Type === BaseItemKind.Episode
					? `${window.api.basePath}/Items/${item.data.ParentBackdropItemId}/Images/Backdrop`
					: `${window.api.basePath}/Items/${item.data.Id}/Images/Backdrop`,
				item.data.Id,
			);
		}
	}, [item.isSuccess]);

	if (item.isLoading || similarItems.isLoading) {
		return (
			<Box
				sx={{
					width: "100%",
					height: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<CircularProgress />
			</Box>
		);
	}
	if (item.isSuccess && similarItems.isSuccess) {
		return (
			<div
				className="scrollY"
				style={{
					padding: "5em 2em 2em 1em",
					display: "flex",
					flexDirection: "column",
					gap: "0.5em",
				}}
			>
				<Hero
					item={item.data}
					userId={user.data.Id}
					queryKey={["item", id]}
					artists={item.data.ArtistItems}
					albumBy={item.data.AlbumArtists[0]}
					disableMarkAsPlayedButton
					audioPlayButton
				/>
				{musicTracks.isLoading ? (
					<></>
				) : (
					musicTracks.data.TotalRecordCount > 0 && (
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
									background:
										"rgb(255 255 255 / 0.1)",
									boxShadow:
										"0 0 10px rgb(0 0 0 / 0.5)",
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
									onClick={() => {
										console.log("Hvnrjn");
									}}
								>
									Name
								</Typography>
								<MdiClockOutline />
							</div>
							{musicTracks.data.Items.map(
								(track, index) => {
									return (
										<div
											key={track.Id}
											className={
												currentTrackItem.Id ==
													track.Id &&
												currentTrackItem.ParentId ==
													track.ParentId
													? "item-detail-album-track playing"
													: "item-detail-album-track"
											}
											onClick={() =>
												playTrack(index)
											}
										>
											<Typography
												variant="subtitle1"
												style={{
													justifySelf:
														"end",
												}}
											>
												{!!track.IndexNumber
													? track.IndexNumber
													: "-"}
											</Typography>

											<LikeButton
												itemId={track.Id}
												isFavorite={
													track.UserData
														?.IsFavorite
												}
												queryKey={[
													"item",
													id,
													"musicTracks",
												]}
												userId={
													user.data.Id
												}
												itemName={
													track.Name
												}
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
													flexDirection:
														"column",
													width: "100%",
												}}
											>
												<Typography
													variant="subtitle1"
													style={{
														justifySelf:
															"start",
													}}
													fontWeight={
														500
													}
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
															(
																artist,
															) =>
																artist.Name,
														).join(
															", ",
														)}
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
								},
							)}
						</Paper>
					)
				)}

				{similarItems.data.TotalRecordCount > 0 && (
					<CardScroller
						title="You may also like"
						displayCards={8}
						disableDecoration
					>
						{similarItems.data.Items.map((similar, index) => {
							return (
								<Card
									key={similar.Id}
									item={similar}
									seriesId={similar.SeriesId}
									cardTitle={
										similar.Type ==
										BaseItemKind.Episode
											? similar.SeriesName
											: similar.Name
									}
									imageType={"Primary"}
									cardCaption={
										similar.Type ==
										BaseItemKind.Episode
											? `S${similar.ParentIndexNumber}:E${similar.IndexNumber} - ${similar.Name}`
											: similar.Type ==
											  BaseItemKind.Series
											? `${
													similar.ProductionYear
											  } - ${
													!!similar.EndDate
														? new Date(
																similar.EndDate,
														  ).toLocaleString(
																[],
																{
																	year: "numeric",
																},
														  )
														: "Present"
											  }`
											: similar.ProductionYear
									}
									cardType={
										similar.Type ==
											BaseItemKind.MusicAlbum ||
										similar.Type ==
											BaseItemKind.Audio
											? "square"
											: "portrait"
									}
									queryKey={[
										"item",
										id,
										"similarItem",
									]}
									userId={user.data.Id}
									imageBlurhash={
										!!similar.ImageBlurHashes
											?.Primary &&
										similar.ImageBlurHashes
											?.Primary[
											Object.keys(
												similar
													.ImageBlurHashes
													.Primary,
											)[0]
										]
									}
								/>
							);
						})}
					</CardScroller>
				)}
			</div>
		);
	}
	if (item.isError || similarItems.isError) {
		return <ErrorNotice />;
	}
};

export default MusicAlbumTitlePage;
