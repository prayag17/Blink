import PropTypes from "prop-types";
import React, { useState, useEffect, useLayoutEffect, useRef } from "react";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";

import useParallax from "@/utils/hooks/useParallax";
import { AnimatePresence, motion, useScroll } from "framer-motion";

import {
	BaseItemKind,
	ItemFields,
	SortOrder,
} from "@jellyfin/sdk/lib/generated-client";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";

import { useQuery } from "@tanstack/react-query";

import LikeButton from "@/components/buttons/likeButton";
import { Card } from "@/components/card/card";
import { Blurhash } from "react-blurhash";

import meshBg from "@/assets/herobg.png";
import { ArtistAlbum } from "@/components/layouts/artist/artistAlbum";
import MusicTrack from "@/components/musicTrack";
import { ErrorNotice } from "@/components/notices/errorNotice/errorNotice";
import ShowMoreText from "@/components/showMoreText";
import { setBackdrop, useBackdropStore } from "@/utils/store/backdrop";
import "./artist.scss";

import IconLink from "@/components/iconLink";
import { getTypeIcon } from "@/components/utils/iconsCollection";
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

export const Route = createFileRoute("/_api/artist/$id")({
	component: ArtistTitlePage,
});

function ArtistTitlePage() {
	const { id } = Route.useParams();
	const api = Route.useRouteContext().api;

	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			const usr = await getUserApi(api).getCurrentUser();
			return usr.data;
		},
		networkMode: "always",
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

	const artistDiscography = useQuery({
		queryKey: ["item", id, "artist", "discography"],
		queryFn: async () => {
			const result = await getItemsApi(api).getItems({
				albumArtistIds: [item.data.Id],
				sortBy: ["PremiereDate", "ProductionYear", "SortName"],
				sortOrder: [SortOrder.Descending],
				recursive: true,
				includeItemTypes: [BaseItemKind.MusicAlbum],
				userId: user.data.Id,
				fields: [ItemFields.Overview],
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data.Type === BaseItemKind.MusicArtist,
	});

	const artistSongs = useQuery({
		queryKey: ["item", id, "artist", "songs"],
		queryFn: async () => {
			const result = await getItemsApi(api).getItems({
				artistIds: [item.data.Id],
				sortBy: ["PremiereDate", "ProductionYear", "SortName"],
				sortOrder: [SortOrder.Ascending],
				recursive: true,
				includeItemTypes: [BaseItemKind.Audio],
				userId: user.data.Id,
				fields: [ItemFields.Overview],
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data.Type === BaseItemKind.MusicArtist,
	});

	const artistAppearances = useQuery({
		queryKey: ["item", id, "artist", "appearences"],
		queryFn: async () => {
			const result = await getItemsApi(api).getItems({
				contributingArtistIds: [item.data.Id],
				excludeItemIds: [item.data.Id],
				sortBy: ["PremiereDate", "ProductionYear", "SortName"],
				sortOrder: [SortOrder.Descending],
				recursive: true,
				includeItemTypes: [BaseItemKind.MusicAlbum],
				userId: user.data.Id,
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data.Type === BaseItemKind.MusicArtist,
	});

	const artistTabs = [
		{ title: "Discography", data: artistDiscography },
		{ title: "Songs", data: artistSongs },
		{ title: "Appearances", data: artistAppearances },
	];
	const [activeArtistTab, setActiveArtistTab] = useState(0);

	useLayoutEffect(() => {
		if (
			artistDiscography.isSuccess &&
			artistSongs.isSuccess &&
			artistAppearances.isSuccess
		) {
			if (artistDiscography.data.TotalRecordCount !== 0) {
				setActiveArtistTab(0);
			} else if (artistSongs.data.TotalRecordCount !== 0) {
				setActiveArtistTab(1);
			} else if (artistAppearances.data.TotalRecordCount !== 0) {
				setActiveArtistTab(2);
			}
		}
	}, [
		artistDiscography.isSuccess,
		artistSongs.isSuccess,
		artistAppearances.isSuccess,
	]);

	const [animationDirection, setAnimationDirection] = useState("forward");

	useEffect(() => {
		if (item.isSuccess) {
			setBackdrop(
				`${api.basePath}/Items/${item.data.Id}/Images/Backdrop`,
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

	if (item.isPending) {
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
	if (item.isSuccess) {
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
				className="scrollY item item-artist"
				ref={pageRef}
			>
				<div className="item-hero flex flex-row">
					<div className="item-hero-backdrop-container">
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
							<Typography variant="h2" fontWeight={200}>
								{item.data.Name}
							</Typography>
						)}

						<LikeButton
							itemName={item.data.Name}
							itemId={item.data.Id}
							queryKey={["item", id]}
							isFavorite={item.data.UserData.IsFavorite}
							userId={user.data.Id}
						/>
					</div>
				</div>
				<div className="item-detail">
					<div style={{ width: "100%", overflow: "hidden" }}>
						<ShowMoreText
							content={item.data.Overview ?? ""}
							collapsedLines={4}
						/>
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
					<div
						style={{
							width: "100%",
						}}
					>
						{item.data.PremiereDate && (
							<>
								<Typography variant="h5">Born</Typography>
								<Typography sx={{ opacity: 0.8 }}>
									{new Date(item.data.PremiereDate).toDateString()}
								</Typography>
							</>
						)}
						{item.data.EndDate && (
							<>
								<Typography variant="h5" mt={2}>
									Death
								</Typography>
								<Typography sx={{ opacity: 0.8 }}>
									{new Date(item.data.EndDate).toDateString()}
								</Typography>
							</>
						)}
					</div>
				</div>
				<div className="item-detail-artist-container">
					<div className="item-detail-artist-header">
						<Tabs
							variant="scrollable"
							value={activeArtistTab}
							onChange={(e, newVal) => {
								if (newVal > activeArtistTab) {
									setAnimationDirection("forward");
								} else if (newVal < activeArtistTab) {
									setAnimationDirection("backwards");
								}
								setActiveArtistTab(newVal);
							}}
						>
							{artistTabs.map((tab, index) => {
								return (
									<Tab
										key={tab.title}
										label={tab.title}
										disabled={tab.data.data?.TotalRecordCount === 0}
									/>
								);
							})}
						</Tabs>
						<Divider />
					</div>
					<AnimatePresence>
						<TabPanel value={activeArtistTab} index={0}>
							<motion.div
								key={activeArtistTab}
								initial={{
									opacity: 0,
									transform:
										animationDirection === "forward"
											? "translate(30px)"
											: "translate(-30px)",
								}}
								animate={{
									opacity: 1,
									transform: "translate(0px)",
								}}
								transition={{
									duration: 0.2,
									ease: "anticipate",
								}}
							>
								{artistDiscography.isSuccess &&
									artistDiscography.data.Items.map((tabitem) => {
										return (
											<ArtistAlbum
												key={tabitem.Id}
												user={user.data}
												album={tabitem}
											/>
										);
									})}
							</motion.div>
						</TabPanel>
						<TabPanel value={activeArtistTab} index={1}>
							<motion.div
								key={activeArtistTab}
								initial={{
									opacity: 0,
									transform:
										animationDirection === "forward"
											? "translate(30px)"
											: "translate(-30px)",
								}}
								animate={{
									opacity: 1,
									transform: "translate(0px)",
								}}
								transition={{
									duration: 0.2,
									ease: "anticipate",
								}}
							>
								{artistSongs.isSuccess &&
									artistSongs.data.Items.map((tabitem) => {
										return (
											<MusicTrack
												item={tabitem}
												key={tabitem.Id}
												queryKey={["item", id, "artist", "songs"]}
												userId={user.data.Id}
											/>
										);
									})}
							</motion.div>
						</TabPanel>
						<TabPanel value={activeArtistTab} index={2}>
							<motion.div
								key={activeArtistTab}
								initial={{
									opacity: 0,
									transform:
										animationDirection === "forward"
											? "translate(30px)"
											: "translate(-30px)",
								}}
								animate={{
									opacity: 1,
									transform: "translate(0px)",
								}}
								transition={{
									duration: 0.2,
									ease: "anticipate",
								}}
								className="grid"
							>
								{artistAppearances.isSuccess &&
									artistAppearances.data.Items.map((tabitem) => {
										return (
											<Card
												key={tabitem.Id}
												item={tabitem}
												cardTitle={tabitem.Name}
												imageType={"Primary"}
												cardCaption={tabitem.AlbumArtist}
												cardType={"square"}
												queryKey={["item", id, "artist", "appearences"]}
												userId={user.data.Id}
												imageBlurhash={
													!!tabitem.ImageBlurHashes?.Primary &&
													tabitem.ImageBlurHashes?.Primary[
														Object.keys(tabitem.ImageBlurHashes.Primary)[0]
													]
												}
											/>
										);
									})}
							</motion.div>
						</TabPanel>
					</AnimatePresence>
				</div>
			</motion.div>
		);
	}
	if (item.isError) {
		return <ErrorNotice />;
	}
}

export default ArtistTitlePage;
