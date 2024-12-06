import React, {
	useState,
	useEffect,
	useLayoutEffect,
	useRef,
	type ReactNode,
} from "react";

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
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";

import { useQuery } from "@tanstack/react-query";

import LikeButton from "@/components/buttons/likeButton";
import { Card } from "@/components/card/card";
import { Blurhash } from "react-blurhash";

import { ArtistAlbum } from "@/components/layouts/artist/artistAlbum";
import MusicTrack from "@/components/musicTrack";
import { ErrorNotice } from "@/components/notices/errorNotice/errorNotice";
import ShowMoreText from "@/components/showMoreText";
import { useBackdropStore } from "@/utils/store/backdrop";
import "./artist.scss";

import IconLink from "@/components/iconLink";
import { getTypeIcon } from "@/components/utils/iconsCollection";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import { useCentralStore } from "@/utils/store/central";
import { createFileRoute } from "@tanstack/react-router";


type TabPanelProp = {
	children: ReactNode;
	index: number;
	value: number;
};

function TabPanel(props: TabPanelProp) {
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

export const Route = createFileRoute("/_api/artist/$id")({
	component: ArtistTitlePage,
});

function ArtistTitlePage() {
	const { id } = Route.useParams();
	const api = Route.useRouteContext().api;

	const user = useCentralStore((s) => s.currentUser);

	const item = useQuery({
		queryKey: ["item", id],
		queryFn: async () => {
			if (!api) return null;
			const result = await getUserLibraryApi(api).getItem({
				userId: user?.Id,
				itemId: id,
			});
			return result.data;
		},
		enabled: !!user?.Id,
		networkMode: "always",
		refetchOnWindowFocus: true,
	});

	const artistDiscography = useQuery({
		queryKey: ["item", id, "artist", "discography"],
		queryFn: async () => {
			if (!api) return null;
			const result = await getItemsApi(api).getItems({
				albumArtistIds: [item.data?.Id ?? ""],
				sortBy: ["PremiereDate", "ProductionYear", "SortName"],
				sortOrder: [SortOrder.Descending],
				recursive: true,
				includeItemTypes: [BaseItemKind.MusicAlbum],
				userId: user?.Id,
				fields: [ItemFields.Overview],
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data?.Type === BaseItemKind.MusicArtist,
	});

	const artistSongs = useQuery({
		queryKey: ["item", id, "artist", "songs"],
		queryFn: async () => {
			if (!api) return null;

			const result = await getItemsApi(api).getItems({
				artistIds: [item.data?.Id ?? ""],
				sortBy: ["PremiereDate", "ProductionYear", "SortName"],
				sortOrder: [SortOrder.Ascending],
				recursive: true,
				includeItemTypes: [BaseItemKind.Audio],
				userId: user?.Id,
				fields: [ItemFields.Overview],
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data?.Type === BaseItemKind.MusicArtist,
	});

	const artistAppearances = useQuery({
		queryKey: ["item", id, "artist", "appearences"],
		queryFn: async () => {
			if (!api) return null;
			const result = await getItemsApi(api).getItems({
				contributingArtistIds: [item.data?.Id ?? ""],
				excludeItemIds: [item.data?.Id ?? ""],
				sortBy: ["PremiereDate", "ProductionYear", "SortName"],
				sortOrder: [SortOrder.Descending],
				recursive: true,
				includeItemTypes: [BaseItemKind.MusicAlbum],
				userId: user?.Id,
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data?.Type === BaseItemKind.MusicArtist,
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
			artistAppearances.isSuccess &&
			artistDiscography.data &&
			artistSongs.data &&
			artistAppearances.data
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

	const { setBackdrop } = useBackdropStore();
	useEffect(() => {
		if (item.isSuccess && item.data) {
			setBackdrop(
				`${api?.basePath}/Items/${item.data.Id}/Images/Backdrop`,
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
	if (item.isSuccess && item.data) {
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
							alt={item.data?.Name ?? ""}
							src={
								api &&
								getImageUrlsApi(api).getItemImageUrlById(
									item.data?.Id ?? "",
									"Backdrop",
									{
										tag: item.data.BackdropImageTags?.[0],
									},
								)
							}
							className="item-hero-backdrop"
							onLoad={(e) => {
								e.currentTarget.style.opacity = "1";
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
						{item.data.ImageTags?.Primary ? (
							<div>
								<Blurhash
									hash={
										item.data.ImageBlurHashes?.Primary?.[
											item.data.ImageTags.Primary
										] ?? ""
									}
									className="item-hero-image-blurhash"
								/>
								<img
									alt={item.data.Name ?? ""}
									src={
										api &&
										getImageUrlsApi(api).getItemImageUrlById(
											item.data.Id ?? "",
											"Primary",
											{
												quality: 90,
												tag: item.data.ImageTags.Primary,
											},
										)
									}
									onLoad={(e) => {
										e.currentTarget.style.opacity = "1";
									}}
									className="item-hero-image"
								/>
							</div>
						) : (
							<div className="item-hero-image-icon">
								{getTypeIcon(item.data.Type ?? "MusicArtist")}
							</div>
						)}
					</div>
					<div className="item-hero-detail flex flex-column">
						{item.data.ImageTags?.Logo ? (
							<img
								alt={item.data.Name ?? ""}
								src={
									api &&
									getImageUrlsApi(api).getItemImageUrlById(
										item.data.Id ?? "",
										"Logo",
										{
											quality: 90,
											fillWidth: 592,
											fillHeight: 592,
										},
									)
								}
								onLoad={(e) => {
									e.currentTarget.style.opacity = "1";
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
							isFavorite={item.data.UserData?.IsFavorite}
							userId={user?.Id}
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
							{item.data.ExternalUrls?.map((url) => (
								<IconLink
									url={url.Url ?? ""}
									name={url.Name ?? ""}
									key={url.Url}
								/>
							))}
						</div>
					</div>
					<div
						style={{
							width: "100%",
						}}
					>
						{item.data.PremiereDate && (
							<div>
								<Typography variant="h5">Born</Typography>
								<Typography sx={{ opacity: 0.8 }}>
									{new Date(item.data.PremiereDate).toDateString()}
								</Typography>
							</div>
						)}
						{item.data.EndDate && (
							<div>
								<Typography variant="h5" mt={2}>
									Death
								</Typography>
								<Typography sx={{ opacity: 0.8 }}>
									{new Date(item.data.EndDate).toDateString()}
								</Typography>
							</div>
						)}
					</div>
				</div>
				<div className="item-detail-artist-container">
					<div className="item-detail-artist-header">
						<Tabs
							variant="scrollable"
							value={activeArtistTab}
							onChange={(_, newVal) => {
								if (newVal > activeArtistTab) {
									setAnimationDirection("forward");
								} else if (newVal < activeArtistTab) {
									setAnimationDirection("backwards");
								}
								setActiveArtistTab(newVal);
							}}
						>
							{artistTabs.map((tab) => {
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
								{user &&
									artistDiscography.data?.Items?.map((tabitem) => {
										return (
											<ArtistAlbum
												key={tabitem.Id}
												user={user}
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
									artistSongs.data?.Items?.map((tabitem) => {
										return (
											<MusicTrack
												item={tabitem}
												key={tabitem.Id}
												queryKey={["item", id, "artist", "songs"]}
												userId={user?.Id}
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
									artistAppearances.data?.Items?.map((tabitem) => {
										return (
											<Card
												key={tabitem.Id}
												item={tabitem}
												cardTitle={tabitem.Name}
												imageType={"Primary"}
												cardCaption={tabitem.AlbumArtist}
												cardType={"square"}
												queryKey={["item", id, "artist", "appearences"]}
												userId={user?.Id}
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
