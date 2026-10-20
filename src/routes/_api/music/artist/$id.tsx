import {
	BaseItemKind,
	ItemFields,
	SortOrder,
} from "@jellyfin/sdk/lib/generated-client";
import { getLibraryApi } from "@jellyfin/sdk/lib/utils/api/library-api";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import React, {
	type ReactNode,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";

import LikeButton from "@/components/buttons/likeButton";
import PlayButton from "@/components/buttons/playButton";
import { Card } from "@/components/card/card";
import ItemHeader from "@/components/itemHeader";
import { ArtistAlbum } from "@/components/layouts/artist/artistAlbum";
import MusicTrack from "@/components/musicTrack";
import { ErrorNotice } from "@/components/notices/errorNotice/errorNotice";
import ShowMoreText from "@/components/showMoreText";
import { useBackdropStore } from "@/utils/store/backdrop";
import "./artist.scss";

import type { Api } from "@jellyfin/sdk";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { createFileRoute } from "@tanstack/react-router";
import IconLink from "@/components/iconLink";
import { useCentralStore } from "@/utils/store/central";
import { playItemFromQueue } from "@/utils/store/playback";
import { setQueue } from "@/utils/store/queue";

/** Queues the given tracks in random order and starts playing. */
const shuffleAndPlay = (
	tracks: BaseItemDto[],
	userId: string | undefined,
	api: Api | undefined,
) => {
	const shuffled = [...tracks];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	setQueue(shuffled, 0);
	playItemFromQueue(0, userId, api);
};

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

export const Route = createFileRoute("/_api/music/artist/$id")({
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
			const result = await getLibraryApi(api).getItem({
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
			const result = await getLibraryApi(api).getItems({
				albumArtistIds: [id],
				sortBy: ["PremiereDate", "ProductionYear", "SortName"],
				sortOrder: [SortOrder.Descending],
				recursive: true,
				includeItemTypes: [BaseItemKind.MusicAlbum],
				userId: user?.Id,
				fields: [ItemFields.Overview],
			});
			return result.data;
		},
	});

	const artistSongs = useQuery({
		queryKey: ["item", id, "artist", "songs"],
		queryFn: async () => {
			if (!api) return null;

			const result = await getLibraryApi(api).getItems({
				artistIds: [id],
				sortBy: ["PremiereDate", "ProductionYear", "SortName"],
				sortOrder: [SortOrder.Ascending],
				recursive: true,
				includeItemTypes: [BaseItemKind.Audio],
				userId: user?.Id,
				fields: [ItemFields.Overview],
			});
			return result.data;
		},
	});

	const artistAppearances = useQuery({
		queryKey: ["item", id, "artist", "appearences"],
		queryFn: async () => {
			if (!api) return null;
			const result = await getLibraryApi(api).getItems({
				contributingArtistIds: [id],
				excludeItemIds: [id],
				sortBy: ["PremiereDate", "ProductionYear", "SortName"],
				sortOrder: [SortOrder.Descending],
				recursive: true,
				includeItemTypes: [BaseItemKind.MusicAlbum],
				userId: user?.Id,
			});
			return result.data;
		},
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

	const setBackdrop = useBackdropStore((s) => s.setBackdrop);
	const backdropTag = item.data?.BackdropImageTags?.[0];
	const backdropHash =
		(backdropTag && item.data?.ImageBlurHashes?.Backdrop?.[backdropTag]) || "";
	useEffect(() => {
		setBackdrop(backdropHash);
	}, [backdropHash, setBackdrop]);

	const scrollTargetRef = useRef<HTMLDivElement | null>(null);

	const pluralize = (count: number, word: string) =>
		`${count} ${count === 1 ? word : `${word}s`}`;
	const catalogueSummary = [
		artistDiscography.data?.TotalRecordCount
			? pluralize(artistDiscography.data.TotalRecordCount, "album")
			: null,
		artistSongs.data?.TotalRecordCount
			? pluralize(artistSongs.data.TotalRecordCount, "song")
			: null,
	]
		.filter(Boolean)
		.join(" · ");

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
			>
				<div ref={scrollTargetRef} />
				<ItemHeader
					item={item.data}
					api={api}
					scrollTargetRef={scrollTargetRef}
				>
					<div className="item-hero-buttons-container">
						<div className="flex flex-row" style={{ width: "100%" }}>
							<PlayButton
								item={item.data}
								itemType={BaseItemKind.MusicArtist}
								userId={user?.Id}
								audio
								buttonProps={{ fullWidth: true }}
							/>
						</div>
						<div className="flex flex-row" style={{ gap: "1em" }}>
							<Tooltip title="Shuffle">
								<span>
									<IconButton
										aria-label="Shuffle"
										disabled={!artistSongs.data?.Items?.length}
										onClick={() =>
											shuffleAndPlay(
												artistSongs.data?.Items ?? [],
												user?.Id,
												api,
											)
										}
									>
										<span className="material-symbols-rounded">shuffle</span>
									</IconButton>
								</span>
							</Tooltip>
							<LikeButton
								itemName={item.data.Name}
								itemId={item.data.Id}
								queryKey={["item", id]}
								isFavorite={item.data.UserData?.IsFavorite}
								userId={user?.Id}
							/>
						</div>
					</div>
				</ItemHeader>
				<div className="item-detail">
					<div style={{ width: "100%", overflow: "hidden" }}>
						{catalogueSummary && (
							<Typography sx={{ opacity: 0.8, mb: 1.5 }}>
								{catalogueSummary}
							</Typography>
						)}
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
								<Typography
									variant="h5"
									sx={{
										mt: 2,
									}}
								>
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
