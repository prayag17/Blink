import PropTypes from "prop-types";
import React, { useEffect, useRef } from "react";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import useParallax from "@/utils/hooks/useParallax";
import { motion, useScroll } from "framer-motion";

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

import { Card } from "@/components/card/card";
import { CardScroller } from "@/components/cardScroller/cardScroller";

import { ErrorNotice } from "@/components/notices/errorNotice/errorNotice";
import ShowMoreText from "@/components/showMoreText";
import { endsAt, getRuntime } from "@/utils/date/time";
import { setBackdrop, useBackdropStore } from "@/utils/store/backdrop";
import { Blurhash } from "react-blurhash";

import LikeButton from "@/components/buttons/likeButton";
import MarkPlayedButton from "@/components/buttons/markPlayedButton";
import PlayButton from "@/components/buttons/playButton";

import heroBg from "@/assets/herobg.png";
import "./boxset.scss";

import IconLink from "@/components/iconLink";
import { createFileRoute } from "@tanstack/react-router";

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

export const Route = createFileRoute("/_api/boxset/$id")({
	component: BoxSetTitlePage,
});

function BoxSetTitlePage() {
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
			if (item.data.BackdropImageTags?.length > 0) {
				setBackdrop(
					api?.getItemImageUrl(item.data.Id, "Backdrop", {
						tag: item.data.BackdropImageTags[0],
					}),
					item.data.Id,
				);
			} else {
				setBackdrop("", "");
			}
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
						{item.data.BackdropImageTags?.length ? (
							<motion.img
								alt={item.data.Name}
								src={api.getItemImageUrl(item.data.Id, "Backdrop", {
									tag: item.data.BackdropImageTags[0],
								})}
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
					<div className="item-hero-detail">
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
							<Typography variant="h2" fontWeight={200} mb={2}>
								{item.data.Name}
							</Typography>
						)}

						<Stack
							direction="row"
							gap={2}
							justifyItems="flex-start"
							alignItems="center"
						>
							{item.data.PremiereDate && (
								<Typography style={{ opacity: "0.8" }} variant="subtitle2">
									{item.data.ProductionYear ?? ""}
								</Typography>
							)}
							{item.data.OfficialRating && (
								<Chip
									variant="filled"
									size="small"
									label={item.data.OfficialRating}
								/>
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
										className="material-symbols-rounded fill"
										style={{
											// fontSize: "2.2em",
											color: yellow[400],
										}}
									>
										star
									</div>
									<Typography
										style={{
											opacity: "0.8",
										}}
										variant="subtitle2"
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
										className="material-symbols-rounded fill"
										style={{
											color:
												item.data.CriticRating > 50 ? green[400] : red[400],
										}}
									>
										{item.data.CriticRating > 50 ? "thumb_up" : "thumb_down"}
									</div>
									<Typography
										style={{
											opacity: "0.8",
										}}
										variant="subtitle2"
									>
										{item.data.CriticRating}
									</Typography>
								</div>
							)}

							{item.data.RunTimeTicks && (
								<Typography style={{ opacity: "0.8" }} variant="subtitle2">
									{getRuntime(item.data.RunTimeTicks)}
								</Typography>
							)}
							{item.data.RunTimeTicks && (
								<Typography style={{ opacity: "0.8" }} variant="subtitle2">
									{endsAt(
										item.data.RunTimeTicks -
											item.data.UserData.PlaybackPositionTicks,
									)}
								</Typography>
							)}
							<Typography variant="subtitle2" style={{ opacity: 0.8 }}>
								{item.data.Genres?.slice(0, 4).join(" / ")}
							</Typography>
						</Stack>
					</div>
					<div className="item-hero-buttons-container flex flex-row">
						<div className="flex flex-row fullWidth">
							<PlayButton
								item={item.data}
								itemId={item.data.Id}
								itemType={item.data.Type}
								itemUserData={item.data.UserData}
								currentVideoTrack={0}
								currentAudioTrack={0}
								currentSubTrack={0}
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
				<div
					className="item-detail"
					style={{
						marginBottom: "2em",
					}}
				>
					<ShowMoreText content={item.data.Overview ?? ""} collapsedLines={4} />
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
					<CardScroller title="" displayCards={7} disableDecoration>
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

export default BoxSetTitlePage;
