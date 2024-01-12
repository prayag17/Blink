import PropTypes from "prop-types";
import React, { useEffect } from "react";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

import { useParams } from "react-router-dom";

import { motion } from "framer-motion";

import {
	BaseItemKind,
	ItemFields,
	SortOrder,
} from "@jellyfin/sdk/lib/generated-client";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getLibraryApi } from "@jellyfin/sdk/lib/utils/api/library-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";

import { useQuery } from "@tanstack/react-query";

import { getRuntimeMusic } from "../../utils/date/time";

import { Card } from "../../components/card/card";
import { CardScroller } from "../../components/cardScroller/cardScroller";
import Hero from "../../components/layouts/item/hero";

import LikeButton from "../../components/buttons/likeButton";
import { ErrorNotice } from "../../components/notices/errorNotice/errorNotice";
import { useApi } from "../../utils/store/api";
import { useAudioPlayback } from "../../utils/store/audioPlayback";
import { useBackdropStore } from "../../utils/store/backdrop";
import "./album.module.scss";

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
	const [api] = useApi((state) => [state.api]);

	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			const usr = await getUserApi(api).getCurrentUser();
			return usr.data;
		},
		networkMode: "always",
		enabled: Boolean(api),
	});

	const item = useQuery({
		queryKey: ["item", id],
		queryFn: async () => {
			const result = await getUserLibraryApi(api).getItem({
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
			const result = await getLibraryApi(api).getSimilarAlbums({
				userId: user.data.Id,
				itemId: item.data.Id,
				limit: 16,
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
			const result = await getItemsApi(api).getItems({
				userId: user.data.Id,
				parentId: item.data.Id,
				sortOrder: SortOrder.Ascending,
				sortBy: "IndexNumber",
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data.Type === BaseItemKind.MusicAlbum,
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
			`${api.basePath}/Audio/${musicTracks.data.Items[index].Id}/universal?deviceId=${api.deviceInfo.id}&userId=${user.data.Id}&api_key=${api.accessToken}`,
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
					? `${api.basePath}/Items/${item.data.ParentBackdropItemId}/Images/Backdrop`
					: `${api.basePath}/Items/${item.data.Id}/Images/Backdrop`,
				item.data.Id,
			);
		}
	});

	if (item.isPending || similarItems.isPending) {
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
			<motion.div
				key={id}
				initial={{
					opacity: 0,
				}}
				animate={{
					opacity: 1,
				}}
				transition={{
					duration: 0.25,
					ease: "easeInOut",
				}}
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
					cardType="square"
				/>
				{musicTracks.isPending ? (
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
									background: "hsl(256, 100%, 4%, 60%)",
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
							{musicTracks.data.Items.map((track, index) => {
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
											queryKey={["item", id, "musicTracks"]}
											userId={user.data.Id}
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
							})}
						</Paper>
					)
				)}

				{similarItems.data.TotalRecordCount > 0 && (
					<CardScroller
						title="You might also like"
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
										similar.Type === BaseItemKind.Episode
											? similar.SeriesName
											: similar.Name
									}
									imageType={"Primary"}
									cardCaption={
										similar.Type === BaseItemKind.Episode
											? `S${similar.ParentIndexNumber}:E${similar.IndexNumber} - ${similar.Name}`
											: similar.Type === BaseItemKind.Series
											  ? `${similar.ProductionYear} - ${
														similar.EndDate
															? new Date(similar.EndDate).toLocaleString([], {
																	year: "numeric",
															  })
															: "Present"
												  }`
											  : similar.ProductionYear
									}
									cardType={
										similar.Type === BaseItemKind.MusicAlbum ||
										similar.Type === BaseItemKind.Audio
											? "square"
											: "portrait"
									}
									queryKey={["item", id, "similarItem"]}
									userId={user.data.Id}
									imageBlurhash={
										!!similar.ImageBlurHashes?.Primary &&
										similar.ImageBlurHashes?.Primary[
											Object.keys(similar.ImageBlurHashes.Primary)[0]
										]
									}
								/>
							);
						})}
					</CardScroller>
				)}
			</motion.div>
		);
	}
	if (item.isError || similarItems.isError) {
		return <ErrorNotice />;
	}
};

export default MusicAlbumTitlePage;
