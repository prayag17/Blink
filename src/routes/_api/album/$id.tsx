import PropTypes from "prop-types";
import React, { useLayoutEffect, useRef } from "react";

import heroBg from "@/assets/herobg.png";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import useParallax from "@/utils/hooks/useParallax";
import { motion, useScroll } from "framer-motion";

import { BaseItemKind, SortOrder } from "@jellyfin/sdk/lib/generated-client";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getLibraryApi } from "@jellyfin/sdk/lib/utils/api/library-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";

import { Blurhash } from "react-blurhash";

import { useQuery } from "@tanstack/react-query";

import { getRuntime } from "@/utils/date/time";

import { Card } from "@/components/card/card";
import { CardScroller } from "@/components/cardScroller/cardScroller";

import LikeButton from "@/components/buttons/likeButton";
import PlayButton from "@/components/buttons/playButton";
import TrackList from "@/components/layouts/tracksList";
import { ErrorNotice } from "@/components/notices/errorNotice/errorNotice";
import ShowMoreText from "@/components/showMoreText";

import { getTypeIcon } from "@/components/utils/iconsCollection";
import { useAudioPlayback } from "@/utils/store/audioPlayback";
import { useBackdropStore } from "@/utils/store/backdrop";
import "./album.scss";

import IconLink from "@/components/iconLink";
import { Link, createFileRoute } from "@tanstack/react-router";

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

export const Route = createFileRoute("/_api/album/$id")({
	component: MusicAlbumTitlePage,
});

function MusicAlbumTitlePage() {
	const { id } = Route.useParams();
	const api = Route.useRouteContext().api;

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
				userId: user.data?.Id,
				itemId: id,
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
				userId: user.data?.Id,
				itemId: item.data?.Id,
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
				userId: user.data?.Id,
				parentId: item.data?.Id,
				sortOrder: [SortOrder.Ascending],
				sortBy: ["IndexNumber"],
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

	useLayoutEffect(() => {
		if (item.isSuccess) {
			setAppBackdrop(
				`${api.basePath}/Items/${item.data.ParentBackdropItemId}/Images/Backdrop`,
				item.data.Id,
			);
		}
	}, [item.isSuccess]);

	const pageRef = useRef(null);
	const { scrollYProgress } = useScroll({
		target: pageRef,
		offset: ["start start", "60vh start"],
	});
	const parallax = useParallax(scrollYProgress, 50);

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
				className="scrollY padded-top item item-album"
				ref={pageRef}
			>
				<div className="item-hero flex flex-row">
					<div className="item-hero-backdrop-container">
						{item.data.ParentBackdropImageTags?.length ? (
							<motion.img
								alt={item.data.Name}
								src={api.getItemImageUrl(
									item.data.ParentBackdropItemId,
									"Backdrop",
									{
										tag: item.data.ParentBackdropImageTags[0],
									},
								)}
								className="item-hero-backdrop"
								onLoad={(e) => {
									e.currentTarget.style.opacity = 1;
								}}
								style={{
									y: parallax,
								}}
							/>
						) : (
							<motion.img
								alt={item.data.Name}
								src={heroBg}
								className="item-hero-backdrop"
								onLoad={(e) => {
									e.currentTarget.style.opacity = 1;
								}}
								style={{
									y: parallax,
								}}
							/>
						)}
					</div>
					<div
						className="item-hero-image-container"
						style={{
							aspectRatio: item.data.PrimaryImageAspectRatio ?? 1,
						}}
					>
						{Object.keys(item.data.ImageTags).includes("Primary") ? (
							<>
								<Blurhash
									hash={
										item.data.ImageBlurHashes.Primary[
											item.data.ImageTags.Primary
										]
									}
									className="item-hero-image-blurhash"
								/>
								<img
									alt={item.data.Name}
									src={api.getItemImageUrl(item.data.Id, "Primary", {
										quality: 90,
										tag: item.data.ImageTags.Primary,
									})}
									onLoad={(e) => {
										e.currentTarget.style.opacity = 1;
									}}
									className="item-hero-image"
								/>
							</>
						) : (
							<div className="item-hero-image-icon">
								{getTypeIcon(item.data.Type)}
							</div>
						)}
					</div>
					<div className="item-hero-detail flex flex-column">
						<Typography variant="h2" fontWeight={200} mb={2}>
							{item.data.Name}
						</Typography>

						<Stack
							direction="row"
							gap={2}
							justifyItems="flex-start"
							alignItems="center"
						>
							<Chip
								size="small"
								label={item.data.AlbumArtist}
								icon={
									<span
										className="material-symbols-rounded"
										style={{
											padding: "0.2em",

											fontVariationSettings:
												'"FILL" 1, "wght" 300, "GRAD" 25, "opsz" 40',
										}}
									>
										artist
									</span>
								}
							/>
							{item.data.PremiereDate && (
								<Typography style={{ opacity: "0.8" }} variant="subtitle2">
									{item.data.ProductionYear ?? ""}
								</Typography>
							)}
							<Typography style={{ opacity: "0.8" }} variant="subtitle2">
								{item.data.ChildCount > 1
									? `${item.data.ChildCount} Tracks`
									: `${item.data.ChildCount} Track`}
							</Typography>
							{item.data.RunTimeTicks && (
								<Typography style={{ opacity: "0.8" }} variant="subtitle2">
									{getRuntime(item.data.RunTimeTicks)}
								</Typography>
							)}
							<Typography variant="subtitle2" style={{ opacity: 0.8 }}>
								{item.data.Genres?.slice(0, 4).join(" / ")}
							</Typography>
						</Stack>
					</div>

					<div className="item-hero-buttons-container">
						<div className="flex flex-row fullWidth">
							<PlayButton
								audio
								item={item.data}
								itemId={item.data.Id}
								itemType={item.data.Type}
								itemUserData={item.data.UserData}
								userId={user.data.Id}
								buttonProps={{
									fullWidth: true,
								}}
							/>
						</div>
						<div className="flex flex-row" style={{ gap: "1em" }}>
							<LikeButton
								itemName={item.data.Name}
								itemId={item.data.Id}
								queryKey={["item", id]}
								isFavorite={item.data.UserData.IsFavorite}
								userId={user.data.Id}
							/>
						</div>
					</div>
				</div>
				<div
					className="item-detail"
					style={{
						marginBottom: "1em",
					}}
				>
					<div style={{ width: "100%" }}>
						<ShowMoreText
							content={item.data.Overview ?? ""}
							collapsedLines={4}
						/>

						<div
							style={{
								display: "flex",
								gap: "0.6em",
								alignSelf: "start",
								marginTop: "0.2em",
							}}
						>
							{item.data.ExternalUrls.map((url) => (
								<IconLink url={url.Url} name={url.Name} />
							))}
						</div>
					</div>
					<div
						style={{
							width: "100%",
						}}
					>
						<div className="item-detail-cast">
							{item.data.ArtistItems.length > 0 && (
								<div className="item-detail-cast-container">
									<Typography variant="h6" className="item-detail-cast-title">
										Artists
									</Typography>
									<div className="item-detail-cast-grid">
										{item.data.ArtistItems.map((artist) => (
											<Link
												className="item-detail-cast-card"
												key={artist.Id}
												to="/artist/$id"
												params={{
													id: artist.Id,
												}}
											>
												<div
													style={{
														width: "5em",
														position: "relative",
													}}
												>
													<img
														alt={artist.Name}
														src={api.getItemImageUrl(artist.Id, "Primary", {
															quality: 80,
															fillWidth: 200,
															fillHeight: 200,
														})}
														style={{
															position: "absolute",
															top: 0,
															left: 0,
														}}
														className="item-detail-cast-card-image"
													/>

													<div className="item-detail-cast-card-icon">
														{getTypeIcon("Person")}
													</div>
												</div>
												<div className="item-detail-cast-card-text">
													<Typography variant="subtitle1">
														{artist.Name}
													</Typography>
													<Typography
														variant="subtitle2"
														style={{
															opacity: 0.5,
														}}
													>
														{artist.Role}
													</Typography>
												</div>
											</Link>
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
				{musicTracks.isSuccess && musicTracks.data.TotalRecordCount > 0 && (
					<TrackList user={user.data.Id} tracks={musicTracks.data.Items} />
				)}

				{similarItems.data.TotalRecordCount > 0 && (
					<CardScroller
						title="You might also like"
						displayCards={7}
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
}

export default MusicAlbumTitlePage;
