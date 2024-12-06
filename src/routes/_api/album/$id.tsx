import React, { useLayoutEffect, useMemo } from "react";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

import { BaseItemKind, SortOrder } from "@jellyfin/sdk/lib/generated-client";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getLibraryApi } from "@jellyfin/sdk/lib/utils/api/library-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";


import { useQuery } from "@tanstack/react-query";

import { getRuntimeCompact } from "@/utils/date/time";

import { Card } from "@/components/card/card";
import CardScroller from "@/components/cardScroller/cardScroller";

import LikeButton from "@/components/buttons/likeButton";
import PlayButton from "@/components/buttons/playButton";
import { ErrorNotice } from "@/components/notices/errorNotice/errorNotice";

import { getTypeIcon } from "@/components/utils/iconsCollection";
import { useBackdropStore } from "@/utils/store/backdrop";
import "./album.scss";

import AlbumMusicTrack from "@/components/albumMusicTrack";
import ShowMoreText from "@/components/showMoreText";
import TagChip from "@/components/tagChip";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import { useApiInContext } from "@/utils/store/api";
import { useCentralStore } from "@/utils/store/central";
import { Chip } from "@mui/material";
import { Link, createFileRoute } from "@tanstack/react-router";
import { createPortal } from "react-dom";

export const Route = createFileRoute("/_api/album/$id")({
	component: MusicAlbumTitlePage,
});

function MusicAlbumTitlePage() {
	const { id } = Route.useParams();
	const api = useApiInContext((s) => s.api);

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

	const similarItems = useQuery({
		queryKey: ["item", id, "similarItem"],
		queryFn: async () => {
			if (api && item.data?.Id) {
				const result = await getLibraryApi(api).getSimilarAlbums({
					userId: user?.Id,
					itemId: item.data?.Id,
					limit: 16,
				});
				return result.data;
			}
			return null;
		},
		enabled: item.isSuccess,
		networkMode: "always",
		refetchOnWindowFocus: true,
	});

	const musicTracks = useQuery({
		queryKey: ["item", "musicTracks", id],
		queryFn: async () => {
			if (!api) return null;
			const result = await getItemsApi(api).getItems({
				userId: user?.Id,
				parentId: item.data?.Id,
				sortOrder: [SortOrder.Ascending],
				sortBy: ["IndexNumber", "ParentIndexNumber"],
				fields: ["MediaSources"],
			});
			return result.data;
		},
		enabled: item.isSuccess && item.data?.Type === BaseItemKind.MusicAlbum,
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
				`${api?.basePath}/Items/${item.data?.ParentBackdropItemId}/Images/Backdrop`,
				item.data?.Id,
			);
		}
	}, [item.isSuccess]);

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
	if (item.isSuccess && item.data && similarItems.isSuccess) {
		return (
			<div key={id} className="scrollY padded-top item item-album">
				<div className="item-info">
					<Typography className="item-info-name" variant="h3">
						{item.data?.Name}
					</Typography>
					<div className="flex flex-align-center item-info-album-info">
						{/* @ts-ignore - Using Link as component  */}
						<Link
							to="/artist/$id"
							params={{ id: item.data.AlbumArtists?.[0].Id ?? "" }}
						>
							<Chip
								// component={Link}
								className="flex flex-align-center"
								style={{
									color: "white",
									textDecoration: "none",
								}}
								icon={
									<span
										className="material-symbols-rounded fill"
										style={{
											paddingLeft: "0.25em",
										}}
									>
										artist
									</span>
								}
								label={item.data.AlbumArtist}
							/>
						</Link>
						<Typography className="opacity-07">
							{item.data.ProductionYear}
						</Typography>
						<Typography className="opacity-07">
							{(musicTracks.data?.TotalRecordCount ?? 0) > 1
								? `${musicTracks.data?.TotalRecordCount} songs`
								: "Single"}
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
								<div className="item-info-disc-container" key={disc}>
									<div
										className="item-info-disc-header flex flex-row flex-align-center"
										style={{ marginBottom: "1em" }}
									>
										<span
											className="material-symbols-rounded"
											style={{ fontSize: "2em" }}
										>
											album
										</span>
										<Typography variant="h5">Disc {disc}</Typography>
									</div>
									<div className="item-info-track header">
										<span className="material-symbols-rounded index">tag</span>
										<Typography variant="subtitle1">Title</Typography>
										<Typography variant="subtitle1">Duration</Typography>
									</div>
									{musicTracks.data?.Items?.map(
										(track, index) =>
											track.ParentIndexNumber === disc && (
												<AlbumMusicTrack
													key={track.Id}
													track={track}
													trackIndex={index}
													musicTracks={musicTracks.data}
												/>
											),
									)}
								</div>
							))
						) : (
							<div>
								<div className="item-info-track header">
									<span className="material-symbols-rounded index">tag</span>
									<Typography variant="subtitle1">Title</Typography>
									<Typography variant="subtitle1">Duration</Typography>
								</div>
								{musicTracks.data?.Items?.map((track, index) => (
									<AlbumMusicTrack
										key={track.Id}
										track={track}
										trackIndex={index}
										musicTracks={musicTracks.data}
									/>
								))}
							</div>
						)}
					</div>
				</div>
				{createPortal(
					<div className="item-info-sidebar">
						<div className="item-info-sidebar-image-container">
							{item.data.ImageTags?.Primary ? (
								<img
									className="item-info-sidebar-image"
									alt={item.data.Name ?? "Album"}
									src={
										api &&
										getImageUrlsApi(api).getItemImageUrlById(
											item.data.Id ?? "",
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
						<div className="item-info-sidebar-overview">
							<ShowMoreText
								content={item.data.Overview ?? ""}
								collapsedLines={4}
							/>
						</div>
					</div>,
					document.body,
				)}
				{(similarItems.data?.TotalRecordCount ?? 0) > 0 && (
					<CardScroller
						title="You might also like"
						displayCards={5}
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
