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

import {
	type BaseItemDto,
	BaseItemKind,
	SortOrder,
} from "@jellyfin/sdk/lib/generated-client";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getLibraryApi } from "@jellyfin/sdk/lib/utils/api/library-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";

import { Blurhash } from "react-blurhash";

import { useQuery } from "@tanstack/react-query";

import {
	getRuntime,
	getRuntimeCompact,
	getRuntimeMusic,
} from "@/utils/date/time";

import { Card } from "@/components/card/card";
import { CardScroller } from "@/components/cardScroller/cardScroller";

import LikeButton from "@/components/buttons/likeButton";
import PlayButton from "@/components/buttons/playButton";
import TrackList from "@/components/layouts/tracksList";
import { ErrorNotice } from "@/components/notices/errorNotice/errorNotice";
import ShowMoreText from "@/components/showMoreText";

import { getTypeIcon } from "@/components/utils/iconsCollection";
import {
	generateAudioStreamUrl,
	playAudio,
	useAudioPlayback,
} from "@/utils/store/audioPlayback";
import { useBackdropStore } from "@/utils/store/backdrop";
import "./album.scss";

import IconLink from "@/components/iconLink";
import TagChip from "@/components/tagChip";
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
		queryKey: ["item", "musicTracks", id],
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

	const handlePlayback = (
		index: number,
		item: BaseItemDto,
		queue: BaseItemDto[],
	) => {
		const url = generateAudioStreamUrl(
			item.Id,
			user.data?.Id,
			api.deviceInfo.id,
			api.basePath,
		);
		playAudio(url, item, undefined, queue, index);
	};

	const currentPlayingItem = useAudioPlayback((s) => s.item);

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
			<div
				key={id}
				className="scrollY padded-top item item-album"
				ref={pageRef}
			>
				<div className="item-info">
					<Typography className="item-info-name" variant="h3">
						{item.data.Name}
					</Typography>
					<div className="flex flex-align-center item-info-album-info">
						<div className="flex flex-align-center">
							<span
								className="material-symbols-rounded"
								style={{
									opacity: 0.7,
								}}
							>
								artist
							</span>
							<Typography ml={1}>{item.data.AlbumArtist}</Typography>
						</div>
						<Typography className="opacity-07">
							{item.data.ProductionYear}
						</Typography>
						<Typography className="opacity-07">
							{musicTracks.data?.TotalRecordCount > 1
								? `${musicTracks.data?.TotalRecordCount} songs`
								: `1 song`}
						</Typography>
						<Typography className="opacity-07">
							{getRuntimeCompact(item.data.CumulativeRunTimeTicks)}
						</Typography>
					</div>
					<div className="item-info-buttons">
						<PlayButton
							item={item}
							audio
							itemType={item.data.Type}
							userId={user.data?.Id}
						/>
						<LikeButton
							itemId={item.data.Id}
							isFavorite={item.data.UserData?.IsFavorite}
							queryKey={["item", "musicTracks"]}
							userId={user.data?.Id}
							itemName={item.data.Name}
						/>
					</div>
					<div className="item-info-track-container">
						<div className="item-info-track header">
							<span className="material-symbols-rounded index">tag</span>
							<Typography variant="subtitle1">Title</Typography>
							<Typography variant="subtitle1">Duration</Typography>
						</div>
						{musicTracks.data?.Items?.map((track) => (
							<div
								className={
									currentPlayingItem?.Id === track.Id
										? "item-info-track playing"
										: "item-info-track"
								}
								key={track.Id}
								onClick={() =>
									handlePlayback(
										track.IndexNumber,
										track,
										musicTracks.data.Items,
									)
								}
							>
								<div className="index-container">
									<span className="material-symbols-rounded fill ">
										play_arrow
									</span>
									<Typography className="index">
										{track.IndexNumber ?? "-"}
									</Typography>
								</div>
								<div className="item-info-track-info">
									<Typography className="item-info-track-info-name">
										{track.Name}
									</Typography>
									<Typography
										variant="subtitle2"
										style={{
											opacity: 0.6,
										}}
										fontWeight={300}
									>
										{track.Artists?.join(", ")}
									</Typography>
								</div>
								<Typography>{getRuntimeMusic(track.RunTimeTicks)}</Typography>
								<div className="flex flex-align-center">
									<LikeButton
										itemId={track.Id}
										isFavorite={track.UserData?.IsFavorite}
										queryKey={["item", "musicTracks"]}
										userId={user.data?.Id}
										itemName={track.Name}
									/>
								</div>
							</div>
						))}
					</div>
				</div>
				<div className="item-info-sidebar">
					<div className="item-info-sidebar-image-container">
						{item.data.ImageTags?.Primary ? (
							<img
								className="item-info-sidebar-image"
								alt={item.data.Name ?? "Album"}
								src={api.getItemImageUrl(item.data.Id, "Primary", {
									tag: item.data.ImageTags.Primary,
									quality: 90,
								})}
							/>
						) : (
							<div className="item-info-sidebar-icon">
								{getTypeIcon("MusicAlbum")}
							</div>
						)}
					</div>
					<div
						className="flex flex-align-center"
						style={{ gap: "1em", flexWrap: "wrap" }}
					>
						{item.data.GenreItems?.map((genre) => (
							<TagChip label={genre.Name} key={genre.Id} />
						))}
					</div>
					<div className="flex flex-column item-info-sidebar-artist-container">
						{item.data.ArtistItems?.map((artist) => (
							<Link
								to="/artist/$id"
								params={{ id: artist.Id }}
								className="item-info-sidebar-artist"
								key={artist.Id}
							>
								<div className="item-info-sidebar-artist-image-container">
									<img
										className="item-info-sidebar-artist-image"
										alt={artist.Name ?? "Artist"}
										src={api.getItemImageUrl(artist.Id, "Primary", {
											quality: 90,
										})}
									/>
									<span className="material-symbols-rounded">artist</span>
								</div>
								<Typography>{artist.Name}</Typography>
							</Link>
						))}
					</div>
				</div>
				{similarItems.data.TotalRecordCount > 0 && (
					<CardScroller
						title="You might also like"
						displayCards={5}
						disableDecoration
					>
						{similarItems.data.Items.map((similar) => {
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
			</div>
		);
	}
	if (item.isError || similarItems.isError) {
		return <ErrorNotice />;
	}
}

export default MusicAlbumTitlePage;
