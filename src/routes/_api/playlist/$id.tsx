import React, { useEffect } from "react";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client";
import { getLibraryApi } from "@jellyfin/sdk/lib/utils/api/library-api";
import { getPlaylistsApi } from "@jellyfin/sdk/lib/utils/api/playlists-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";

import { useQuery } from "@tanstack/react-query";

import { Card } from "@/components/card/card";
import CardScroller from "@/components/cardScroller/cardScroller";
import { ErrorNotice } from "@/components/notices/errorNotice/errorNotice";
import { useBackdropStore } from "@/utils/store/backdrop";
import "./playlist.scss";
import AlbumMusicTrack from "@/components/albumMusicTrack";
import LikeButton from "@/components/buttons/likeButton";
import PlayButton from "@/components/buttons/playButton";
import ShowMoreText from "@/components/showMoreText";
import TagChip from "@/components/tagChip";
import { getTypeIcon } from "@/components/utils/iconsCollection";
import { getRuntimeCompact } from "@/utils/date/time";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import { useCentralStore } from "@/utils/store/central";
import { Typography } from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import { createPortal } from "react-dom";

export const Route = createFileRoute("/_api/playlist/$id")({
	component: PlaylistTitlePage,
});

function PlaylistTitlePage() {
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

	const similarItems = useQuery({
		queryKey: ["item", id, "similarItem"],
		queryFn: async () => {
			if (!api) return null;
			if (!item.data?.Id) return null;
			const result = await getLibraryApi(api).getSimilarAlbums({
				userId: user?.Id,
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
		queryKey: ["item", "musicTracks"],
		queryFn: async () => {
			if (!api) return null;
			if (!item.data?.Id) return null;
			const result = await getPlaylistsApi(api).getPlaylistItems({
				userId: user?.Id,
				playlistId: item.data.Id,
			});
			return result.data;
		},
		enabled: item.isSuccess,
		networkMode: "always",
	});

	const [setAppBackdrop] = useBackdropStore((state) => [state.setBackdrop]);

	useEffect(() => {
		if (item.isSuccess) {
			setAppBackdrop("", "");
		}
	}, []);

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
			<div key={id} className="scrollY padded-top item item-playlist">
				<div className="item-info">
					<Typography className="item-info-name" variant="h3">
						{item.data?.Name}
					</Typography>
					<div className="flex flex-align-center item-info-playlist-info">
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
							itemType={item.data.Type ?? "Playlist"}
							userId={user?.Id}
						/>
						<LikeButton
							itemId={item.data.Id}
							isFavorite={item.data.UserData?.IsFavorite}
							queryKey={["item"]}
							userId={user?.Id}
							itemName={item.data.Name}
						/>
					</div>
					<div className="item-info-track-container ">
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
					</div>
				</div>
				{createPortal(
					<div className="item-info-sidebar">
						<div className="item-info-sidebar-image-container">
							{item.data.ImageTags?.Primary ? (
								<img
									className="item-info-sidebar-image"
									alt={item.data.Name ?? "Playlist"}
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
									{getTypeIcon("Playlist")}
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
									cardType={"square"}
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

export default PlaylistTitlePage;
