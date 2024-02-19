import PropTypes from "prop-types";
import React, { useState, useEffect, useLayoutEffect, useRef } from "react";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link, useNavigate, useParams } from "react-router-dom";

import { motion, useScroll } from "framer-motion";
import useParallax from "../../utils/hooks/useParallax";

import {
	BaseItemKind,
	ItemFields,
	LocationType,
} from "@jellyfin/sdk/lib/generated-client";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getLibraryApi } from "@jellyfin/sdk/lib/utils/api/library-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
import { useQuery } from "@tanstack/react-query";

import { Card } from "../../components/card/card";
import { CardScroller } from "../../components/cardScroller/cardScroller";
import Hero from "../../components/layouts/item/hero";

import { Blurhash } from "react-blurhash";
import { ErrorNotice } from "../../components/notices/errorNotice/errorNotice";
import ShowMoreText from "../../components/showMoreText";
import { endsAt, getRuntime } from "../../utils/date/time";
import { useApi } from "../../utils/store/api";
import { setBackdrop, useBackdropStore } from "../../utils/store/backdrop";

import LikeButton from "../../components/buttons/likeButton";
import MarkPlayedButton from "../../components/buttons/markPlayedButton";
import PlayButton from "../../components/buttons/playButton";

import meshBg from "../../assets/herobg.png";
import "./boxset.module.scss";

import IconLink from "../../components/iconLink";

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

const BoxSetTitlePage = () => {
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

	const collectionItems = useQuery({
		queryKey: ["item", id, "collection"],
		queryFn: async () => {
			const result = await getItemsApi(api).getItems({
				userId: user.data.Id,
				parentId: item.data.Id,
				fields: [ItemFields.SeasonUserData, ItemFields.Overview],
				excludeLocationTypes: [LocationType.Virtual],
			});
			return result.data;
		},
		enabled: item.isSuccess,
		networkMode: "always",
		refetchOnWindowFocus: true,
	});

	const similarItems = useQuery({
		queryKey: ["item", id, "similarItem"],
		queryFn: async () => {
			const result = await getLibraryApi(api).getSimilarItems({
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

	useEffect(() => {
		if (item.isSuccess) {
			setBackdrop("", "");
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
				className="scrollY item item-boxset padded-top"
				ref={pageRef}
			>
				<div className="item-hero flex flex-row">
					<div className="item-hero-backdrop-container">
						{item.data.BackdropImageTags ? (
							<motion.img
								alt={item.data.Name}
								src={meshBg}
								className="item-hero-backdrop"
								onLoad={(e) => {
									e.currentTarget.style.opacity = 1;
								}}
								style={{
									y: parallax,
								}}
							/>
						) : (
							<></>
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
							<></>
						)}
					</div>
					<div className="item-hero-detail flex flex-column">
						{Object.keys(item.data.ImageTags).includes("Logo") ? (
							<img
								alt={item.data.Name}
								src={api.getItemImageUrl(item.data.Id, "Logo", {
									quality: 90,
									fillWidth: 592,
									fillHeight: 592,
								})}
								onLoad={(e) => {
									e.currentTarget.style.opacity = 1;
								}}
								className="item-hero-logo"
							/>
						) : (
							<Typography variant="h2">{item.data.Name}</Typography>
						)}

						<Stack
							direction="row"
							gap={2}
							justifyItems="flex-start"
							alignItems="center"
						>
							<Typography style={{ opacity: "0.8" }} variant="subtitle1">
								{item.data.ProductionYear ?? ""}
							</Typography>
							{item.data.OfficialRating && (
								<Chip variant="filled" label={item.data.OfficialRating} />
							)}

							{item.data.CommunityRating && (
								<div
									style={{
										display: "flex",
										gap: "0.25em",
										alignItems: "center",
									}}
									className="hero-carousel-info-rating"
								>
									<div
										className="material-symbols-rounded "
										style={{
											// fontSize: "2.2em",
											color: yellow[400],
											fontVariationSettings:
												'"FILL" 1, "wght" 300, "GRAD" 25, "opsz" 40',
										}}
									>
										star
									</div>
									<Typography
										style={{
											opacity: "0.8",
										}}
										variant="subtitle1"
									>
										{Math.round(item.data.CommunityRating * 10) / 10}
									</Typography>
								</div>
							)}
							{item.data.CriticRating && (
								<div
									style={{
										display: "flex",
										gap: "0.25em",
										alignItems: "center",
									}}
									className="hero-carousel-info-rating"
								>
									<div
										className="material-symbols-rounded "
										style={{
											color:
												item.data.CriticRating > 50 ? green[400] : red[400],
											fontVariationSettings:
												'"FILL" 1, "wght" 300, "GRAD" 25, "opsz" 40',
										}}
									>
										{item.data.CriticRating > 50 ? "thumb_up" : "thumb_down"}
									</div>
									<Typography
										style={{
											opacity: "0.8",
										}}
										variant="subtitle1"
									>
										{item.data.CriticRating}
									</Typography>
								</div>
							)}

							{item.data.RunTimeTicks && (
								<Typography style={{ opacity: "0.8" }} variant="subtitle1">
									{getRuntime(item.data.RunTimeTicks)}
								</Typography>
							)}
							{item.data.RunTimeTicks && (
								<Typography style={{ opacity: "0.8" }} variant="subtitle1">
									{endsAt(
										item.data.RunTimeTicks -
											item.data.UserData.PlaybackPositionTicks,
									)}
								</Typography>
							)}
						</Stack>
						<Typography variant="subtitle1" style={{ opacity: 0.8 }}>
							{item.data.Genres.join(", ")}
						</Typography>

						<div className="item-hero-buttons-container flex flex-row">
							<div className="flex flex-row">
								<PlayButton
									itemId={item.data.Id}
									itemType={item.data.Type}
									itemUserData={item.data.UserData}
									currentVideoTrack={0}
									currentAudioTrack={0}
									currentSubTrack={0}
									userId={user.data.Id}
									sx={{
										background: "hsl(195.56deg 29.03% 18.24%) !important",
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
								<MarkPlayedButton
									itemName={item.data.Name}
									itemId={item.data.Id}
									queryKey={["item", id]}
									isPlayed={item.data.UserData.Played}
									userId={user.data.Id}
								/>
							</div>
						</div>
					</div>
				</div>
				<div className="item-detail">
					<div style={{ width: "100%" }}>
						{item.data.UserData.PlaybackPositionTicks > 0 && (
							<div
								style={{
									width: "40%",
									marginBottom: "1em",
								}}
							>
								<Typography>
									{getRuntime(
										item.data.RunTimeTicks -
											item.data.UserData.PlaybackPositionTicks,
									)}{" "}
									left
								</Typography>
								<LinearProgress
									color="white"
									variant="determinate"
									value={item.data.UserData.PlayedPercentage}
									style={{
										borderRadius: "10px",
									}}
								/>
							</div>
						)}
						<Typography variant="h5" fontStyle="italic" mb={1}>
							{item.data.Taglines[0] ?? ""}
						</Typography>
						<ShowMoreText
							content={item.data.Overview ?? ""}
							collapsedLines={4}
						/>
					</div>
					<Divider flexItem orientation="vertical" />
					<div
						style={{
							width: "100%",
						}}
					>
						<div
							style={{
								display: "flex",
								gap: "0.6em",
								alignSelf: "end",
								marginTop: "1em",
							}}
						>
							{item.data.ExternalUrls.map((url) => (
								<IconLink url={url.Url} name={url.Name} />
							))}
						</div>
					</div>
				</div>
				{collectionItems.data.TotalRecordCount > 0 && (
					<CardScroller title="Items" displayCards={8} disableDecoration>
						{collectionItems.data.Items.map((similar, index) => {
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
									cardCaption={similar.ProductionYear}
									cardType={"portrait"}
									queryKey={["item", id, "collection"]}
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

export default BoxSetTitlePage;
