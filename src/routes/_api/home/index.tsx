import React, { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import "./home.scss";

import Carousel from "@/components/carousel";

// Custom Components
import { Card } from "@/components/card/card";
import CardScroller from "@/components/cardScroller/cardScroller";
import { LatestMediaSection } from "@/components/layouts/homeSection/latestMediaSection";
import { CardsSkeleton } from "@/components/skeleton/cards";
import { CarouselSkeleton } from "@/components/skeleton/carousel";

import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getTvShowsApi } from "@jellyfin/sdk/lib/utils/api/tv-shows-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
import { getUserViewsApi } from "@jellyfin/sdk/lib/utils/api/user-views-api";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { useBackdropStore } from "@/utils/store/backdrop";

import { ErrorNotice } from "@/components/notices/errorNotice/errorNotice";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import { useApiInContext } from "@/utils/store/api";
import { useCentralStore } from "@/utils/store/central";
import {
	type BaseItemDto,
	BaseItemKind,
	ItemFields,
} from "@jellyfin/sdk/lib/generated-client";
import Typography from "@mui/material/Typography";
import { ErrorBoundary } from "react-error-boundary";

export const Route = createFileRoute("/_api/home/")({
	component: Home,
});

function Home() {
	const api = useApiInContext((s) => s.api);
	const user = useCentralStore((s) => s.currentUser);

	const libraries = useQuery({
		queryKey: ["libraries"],
		queryFn: async () => {
			const libs = await getUserViewsApi(api).getUserViews({
				userId: user?.Id,
			});
			return libs.data;
		},
		enabled: !!user?.Id && !!api.accessToken,
		networkMode: "always",
	});

	const latestMedia = useQuery({
		queryKey: ["home", "latestMedia"],
		queryFn: async () => {
			const media = await getUserLibraryApi(api).getLatestMedia({
				userId: user?.Id,
				fields: [
					ItemFields.Overview,
					ItemFields.ParentId,
					ItemFields.SeasonUserData,
					ItemFields.IsHd,
					ItemFields.MediaStreams,
					ItemFields.MediaSources,
				],
				includeItemTypes: [
					BaseItemKind.Movie,
					BaseItemKind.Series,
					BaseItemKind.MusicAlbum,
				],
				enableUserData: true,
				enableImages: true,
			});
			return media.data;
		},
		enabled: !!user?.Id,
	});

	const resumeItemsVideo = useQuery({
		queryKey: ["home", "resume", "video"],
		queryFn: async () => {
			const resumeItems = await getItemsApi(api).getResumeItems({
				userId: user?.Id,
				limit: 10,
				mediaTypes: ["Video"],
				enableUserData: true,
				fields: [ItemFields.MediaStreams, ItemFields.MediaSources],
			});
			return resumeItems.data;
		},
		enabled: !!user?.Id,
		refetchOnMount: true,
	});

	const resumeItemsAudio = useQuery({
		queryKey: ["home", "resume", "audio"],
		queryFn: async () => {
			const resumeItems = await getItemsApi(api).getResumeItems({
				userId: user?.Id,
				limit: 10,
				mediaTypes: ["Audio"],
				enableUserData: true,
				fields: [ItemFields.MediaStreams, ItemFields.MediaSources],
			});
			return resumeItems.data;
		},
		enabled: !!user?.Id,
	});

	const upNextItems = useQuery({
		queryKey: ["home", "upNext"],
		queryFn: async () => {
			const upNext = await getTvShowsApi(api).getNextUp({
				userId: user?.Id,
				fields: [
					ItemFields.PrimaryImageAspectRatio,
					ItemFields.MediaStreams,
					ItemFields.MediaSources,
					ItemFields.ParentId,
				],
				limit: 10,
			});
			return upNext.data;
		},
		enabled: !!user?.Id,
		refetchOnMount: true,
	});

	const [latestMediaLibs, setLatestMediaLibs] = useState<
		BaseItemDto[] | undefined
	>([]);

	const navigate = useNavigate();

	const setBackdrop = useBackdropStore((s) => s.setBackdrop);

	const [excludeTypes] = useState(
		() => new Set(["boxsets", "playlists", "livetv", "channels"]),
	);

	useEffect(() => {
		if (libraries.isSuccess) {
			const latestMediaLibsTemp = libraries.data.Items?.reduce(
				(filteredItems: BaseItemDto[], currentItem) => {
					if (currentItem.Type && !excludeTypes.has(currentItem.Type)) {
						filteredItems.push(currentItem);
					}
					return filteredItems;
				},
				[],
			);
			setLatestMediaLibs(latestMediaLibsTemp);
		}
	}, [libraries.isSuccess]);

	return (
		<>
			<main
				className="scrollY home padded-top"
				style={{
					flexGrow: 1,
					position: "relative",
				}}
			>
				<ErrorBoundary FallbackComponent={ErrorNotice}>
					{latestMedia.isPending ? (
						<CarouselSkeleton />
					) : (
						latestMedia.data?.length && (
							<Carousel
								content={latestMedia.data}
								onChange={(now: number) => {
									if (latestMedia.isSuccess && latestMedia.data.length > 0) {
										if (latestMedia.data[now]?.ParentBackdropImageTags) {
											setBackdrop(
												getImageUrlsApi(api).getItemImageUrlById(
													latestMedia.data[now].Id,
													"Backdrop",
													{
														tag: latestMedia.data[now]
															.ParentBackdropImageTags[0],
													},
												),
												latestMedia.data[now]?.ParentBackdropImageTags[0] ??
													latestMedia.data[now].Id,
											);
										} else {
											setBackdrop(
												getImageUrlsApi(api).getItemImageUrlById(
													latestMedia.data[now].Id,
													"Backdrop",
													{
														tag: latestMedia.data[now].BackdropImageTags[0],
													},
												),
												latestMedia.data[now]?.BackdropImageTags[0] ??
													latestMedia.data[now].Id,
											);
										}
									}
								}}
							/>
						)
					)}
				</ErrorBoundary>

				<ErrorBoundary
					fallback={
						<div className="error">
							<Typography>Error with Carousel</Typography>
						</div>
					}
				>
					{libraries.isPending ? (
						<CardsSkeleton />
					) : (
						<CardScroller displayCards={4} title="Libraries">
							{libraries.status === "success" &&
								libraries.data.Items?.map((item) => {
									return (
										<Card
											key={item.Id}
											item={item}
											cardTitle={item.Name}
											imageType="Primary"
											cardType="thumb"
											disableOverlay
											onClick={() => {
												if (item.Id) {
													navigate({
														to: "/library/$id",
														params: { id: item.Id },
													});
												}
											}}
											overrideIcon={item.CollectionType}
										/>
									);
								})}
						</CardScroller>
					)}
				</ErrorBoundary>
				<ErrorBoundary
					fallback={
						<div className="error">
							<Typography>Error with Libraries</Typography>
						</div>
					}
				>
					{upNextItems.isPending ? (
						<CardsSkeleton />
					) : upNextItems.isSuccess && !upNextItems.data.TotalRecordCount ? (
						<></>
					) : (
						<CardScroller displayCards={4} title="Up Next">
							{upNextItems.data?.Items?.map((item) => {
								return (
									<Card
										key={item.Id}
										item={item}
										cardTitle={
											item.Type === BaseItemKind.Episode
												? item.SeriesName
												: item.Name
										}
										imageType={
											item.Type === BaseItemKind.Episode
												? "Primary"
												: item.ImageTags?.Thumb
													? "Thumb"
													: "Backdrop"
										}
										cardCaption={
											item.Type === BaseItemKind.Episode
												? item.ParentIndexNumber === 0
													? `${item.SeasonName} - ${item.Name}`
													: item.IndexNumberEnd
														? `${item.IndexNumber}-${item.IndexNumberEnd}. ${item.Name}`
														: `${item.IndexNumber}. ${item.Name}`
												: item.Type === BaseItemKind.Series
													? `${item.ProductionYear} - ${
															item.EndDate
																? new Date(item.EndDate).toLocaleString([], {
																		year: "numeric",
																	})
																: "Present"
														}`
													: item.ProductionYear
										}
										cardType="thumb"
										queryKey={["home", "upNext"]}
										userId={user?.Id}
									/>
								);
							})}
						</CardScroller>
					)}
				</ErrorBoundary>
				<ErrorBoundary
					fallback={
						<div className="error">
							<Typography>Error with resumeItemsVideo</Typography>
						</div>
					}
				>
					{resumeItemsVideo.isPending ? (
						<CardsSkeleton />
					) : resumeItemsVideo.isSuccess &&
						!resumeItemsVideo.data.TotalRecordCount ? (
						<></>
					) : (
						<CardScroller displayCards={4} title="Continue Watching">
							{resumeItemsVideo.data?.Items?.map((item) => {
								return (
									<Card
										key={item.Id}
										item={item}
										cardTitle={
											item.Type === BaseItemKind.Episode
												? item.SeriesName
												: item.Name
										}
										imageType={
											item.Type === BaseItemKind.Episode
												? "Primary"
												: item.ImageTags?.Thumb
													? "Thumb"
													: "Backdrop"
										}
										cardCaption={
											item.Type === BaseItemKind.Episode
												? `S${item.ParentIndexNumber}:E${item.IndexNumber} - ${item.Name}`
												: item.Type === BaseItemKind.Series
													? `${item.ProductionYear} - ${
															item.EndDate
																? new Date(item.EndDate).toLocaleString([], {
																		year: "numeric",
																	})
																: "Present"
														}`
													: item.ProductionYear
										}
										cardType="thumb"
										queryKey={["home", "resume", "video"]}
										userId={user?.Id}
									/>
								);
							})}
						</CardScroller>
					)}
				</ErrorBoundary>
				<ErrorBoundary
					fallback={
						<div className="error">
							<Typography>Error with resumeItemsAudio</Typography>
						</div>
					}
				>
					{resumeItemsAudio.isPending ? (
						<CardsSkeleton />
					) : resumeItemsAudio.isSuccess &&
						!resumeItemsAudio.data.TotalRecordCount ? (
						<></>
					) : (
						<CardScroller displayCards={4} title="Continue Listening">
							{resumeItemsAudio.data?.Items?.map((item) => {
								return (
									<Card
										key={item.Id}
										item={item}
										cardTitle={item.Name}
										imageType="Primary"
										cardCaption={item.ProductionYear}
										cardType="thumb"
										queryKey={["home", "resume", "audio"]}
										userId={user?.Id}
									/>
								);
							})}
						</CardScroller>
					)}
				</ErrorBoundary>
				<ErrorBoundary
					fallback={
						<div className="error">
							<Typography>Error with LatestMediaSections</Typography>
						</div>
					}
				>
					{latestMediaLibs?.map((lib) => {
						return <LatestMediaSection key={lib.Id} latestMediaLib={lib} />;
					})}
				</ErrorBoundary>
			</main>
		</>
	);
}

export default React.memo(Home);
