import React, { useLayoutEffect, useMemo, useRef } from "react";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

import {
	type BaseItemDto,
	BaseItemKind,
	SortOrder,
} from "@jellyfin/sdk/lib/generated-client";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getLibraryApi } from "@jellyfin/sdk/lib/utils/api/library-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";


import { useQuery } from "@tanstack/react-query";

import { getRuntimeCompact, getRuntimeMusic } from "@/utils/date/time";

import { Card } from "@/components/card/card";
import { CardScroller } from "@/components/cardScroller/cardScroller";

import LikeButton from "@/components/buttons/likeButton";
import PlayButton from "@/components/buttons/playButton";
import { ErrorNotice } from "@/components/notices/errorNotice/errorNotice";

import { getTypeIcon } from "@/components/utils/iconsCollection";
import {
	generateAudioStreamUrl,
	playAudio,
	useAudioPlayback,
} from "@/utils/store/audioPlayback";
import { useBackdropStore } from "@/utils/store/backdrop";
import "./album.scss";

import TagChip from "@/components/tagChip";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import { useCentralStore } from "@/utils/store/central";
import { setQueue } from "@/utils/store/queue";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useSnackbar } from "notistack";
import lyricsIcon from "../../../assets/icons/lyrics.svg";

export const Route = createFileRoute("/_api/album/$id")({
	component: MusicAlbumTitlePage,
});

function MusicAlbumTitlePage() {
	const { id } = Route.useParams();
	const api = Route.useRouteContext().api;

	if (!api) {
		throw new Error("API not found", {
			cause:
				"API is not set in the context, maybe it is not initialized before the component is rendered.",
		});
	}

	const user = useCentralStore((s) => s.currentUser);
	const { enqueueSnackbar } = useSnackbar();

	const item = useQuery({
		queryKey: ["item", id],
		queryFn: async () => {
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

	const similarItems = useQuery({
		queryKey: ["item", id, "similarItem"],
		queryFn: async () => {
			if (item.data?.Id) {
				const result = await getLibraryApi(api).getSimilarAlbums({
					userId: user?.Id,
					itemId: item.data?.Id,
					limit: 16,
				});
				return result.data;
			}
		},
		enabled: item.isSuccess,
		networkMode: "always",
		refetchOnWindowFocus: true,
	});

	const musicTracks = useQuery({
		queryKey: ["item", "musicTracks", id],
		queryFn: async () => {
			const result = await getItemsApi(api).getItems({
				userId: user?.Id,
				parentId: item.data?.Id,
				sortOrder: [SortOrder.Ascending],
				sortBy: ["IndexNumber", "ParentIndexNumber"],
				fields: ["MediaSources"],
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data.Type === BaseItemKind.MusicAlbum,
		networkMode: "always",
	});

	const [setAppBackdrop] = useBackdropStore((state) => [state.setBackdrop]);

	const allDiscs = useMemo(() => {
		const discs: number[] = [];
		if (musicTracks.data?.Items) {
			for (const track of musicTracks.data.Items) {
				if (
					track.ParentIndexNumber &&
					!discs.includes(track.ParentIndexNumber)
				) {
					discs.push(track.ParentIndexNumber);
				}
			}
		}
		return discs;
	}, [musicTracks.data]);
	
	useLayoutEffect(() => {
		if (item.isSuccess) {
			setAppBackdrop(
				`${api?.basePath}/Items/${item.data.ParentBackdropItemId}/Images/Backdrop`,
				item.data.Id,
			);
		}
	}, [item.isSuccess]);

	const pageRef = useRef(null);

	const handlePlayback = (
		index: number,
		item: BaseItemDto,
		queue: BaseItemDto[],
	) => {
		if (!user?.Id || !api) {
			console.error("User not logged in");
			enqueueSnackbar("You need to be logged in to play music", {
				variant: "error",
			});
			return;
		}
		if (item.Id) {
			const url = generateAudioStreamUrl(
				item.Id,
				user.Id,
				api.deviceInfo.id,
				api.basePath,
				api.accessToken,
			);
			playAudio(url, item, undefined);
			setQueue(queue, index);
		}
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
				<div className="item-info-container">
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
								{(musicTracks.data?.TotalRecordCount ?? 0) > 1
									? `${musicTracks.data?.TotalRecordCount} songs`
									: "1 song"}
							</Typography>
							<Typography className="opacity-07">
								{getRuntimeCompact(item.data.CumulativeRunTimeTicks ?? 0)}
							</Typography>
						</div>
						<div className="item-info-buttons">
							<PlayButton
								item={item.data}
								audio
								itemType={item.data.Type ?? "Audio"}
								userId={user?.Id}
							/>
							<LikeButton
								itemId={item.data.Id}
								isFavorite={item.data.UserData?.IsFavorite}
								queryKey={["item", "musicTracks"]}
								userId={user?.Id}
								itemName={item.data.Name}
							/>
						</div>
						<div className="item-info-track-container ">
							{allDiscs.length > 1 ? (
								allDiscs.map((disc) => (
									<>
										<div
											className="item-info-disc-header flex flex-row flex-align-center"
											key={disc}
										>
											<span
												className="material-symbols-rounded"
												style={{ fontSize: "2em" }}
											>
												album
											</span>
											<Typography variant="h5">Disc {disc}</Typography>
										</div>
										<div key={disc} className="item-info-track header">
											<span className="material-symbols-rounded index">
												tag
											</span>
											<Typography variant="subtitle1">Title</Typography>
											<Typography variant="subtitle1">Duration</Typography>
										</div>
										{musicTracks.data?.Items?.map(
											(track, index) =>
												track.ParentIndexNumber === disc && (
													<div
														className={
															currentPlayingItem?.Id === track.Id
																? "item-info-track playing"
																: "item-info-track"
														}
														key={track.Id}
														onClick={() => {
															if (musicTracks.data.Items) {
																handlePlayback(
																	index,
																	track,
																	musicTracks.data.Items,
																);
															}
														}}
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
																	display: "flex",
																	alignItems: "center",
																	gap: "0.6em",
																}}
																fontWeight={300}
															>
																{track.HasLyrics && (
																	<img src={lyricsIcon} alt="lyrics" />
																)}
																{track.Artists?.join(", ")}
															</Typography>
														</div>
														<Typography>
															{getRuntimeMusic(track.RunTimeTicks ?? 0)}
														</Typography>
														<div className="flex flex-align-center">
															<LikeButton
																itemId={track.Id}
																isFavorite={track.UserData?.IsFavorite}
																queryKey={["item", "musicTracks"]}
																userId={user?.Id}
																itemName={track.Name}
															/>
														</div>
													</div>
												),
										)}
									</>
								))
							) : (
								<>
									<div className="item-info-track header">
										<span className="material-symbols-rounded index">tag</span>
										<Typography variant="subtitle1">Title</Typography>
										<Typography variant="subtitle1">Duration</Typography>
									</div>
									{musicTracks.data?.Items?.map((track, index) => (
										<div
											className={
												currentPlayingItem?.Id === track.Id
													? "item-info-track playing"
													: "item-info-track"
											}
											key={track.Id}
											onClick={() =>
												musicTracks.data.Items &&
												handlePlayback(index, track, musicTracks.data.Items)
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
														display: "flex",
														alignItems: "center",
														gap: "0.6em",
													}}
													fontWeight={300}
												>
													{track.HasLyrics && (
														<img src={lyricsIcon} alt="lyrics" />
													)}
													{track.Artists?.join(", ")}
												</Typography>
											</div>
											<Typography>
												{getRuntimeMusic(track.RunTimeTicks ?? 0)}
											</Typography>
											<div className="flex flex-align-center">
												<LikeButton
													itemId={track.Id}
													isFavorite={track.UserData?.IsFavorite}
													queryKey={["item", "musicTracks"]}
													userId={user?.Id}
													itemName={track.Name}
												/>
											</div>
										</div>
									))}
								</>
							)}
						</div>
					</div>
					<div className="item-info-sidebar">
						<div className="item-info-sidebar-image-container">
							{item.data.ImageTags?.Primary ? (
								<img
									className="item-info-sidebar-image"
									alt={item.data.Name ?? "Album"}
									src={
										item.data.Id &&
										getImageUrlsApi(api).getItemImageUrlById(
											item.data.Id,
											"Primary",
											{
												tag: item.data.ImageTags.Primary,
												quality: 90,
											},
										)
									}
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
								<TagChip label={genre.Name ?? "genre"} key={genre.Id} />
							))}
						</div>
						<div className="flex flex-column item-info-sidebar-artist-container">
							{item.data.ArtistItems?.map((artist) => (
								<Link
									to="/artist/$id"
									params={{ id: artist.Id ?? "" }}
									className="item-info-sidebar-artist"
									key={artist.Id}
								>
									<div className="item-info-sidebar-artist-image-container">
										<img
											className="item-info-sidebar-artist-image"
											alt={artist.Name ?? "Artist"}
											src={
												artist.Id &&
												getImageUrlsApi(api).getItemImageUrlById(
													artist.Id,
													"Primary",
													{
														quality: 90,
													},
												)
											}
										/>
										<span className="material-symbols-rounded">artist</span>
									</div>
									<Typography>{artist.Name}</Typography>
								</Link>
							))}
						</div>
					</div>
				</div>
				{(similarItems.data?.TotalRecordCount ?? -1) > 0 && (
					<CardScroller
						title="You might also like"
						displayCards={7}
						disableDecoration
					>
						{similarItems.data?.Items?.map((similar) => {
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
									userId={user?.Id}
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
