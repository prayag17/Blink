import { useQueries, useSuspenseQuery } from "@tanstack/react-query";
import React, { useCallback, useMemo } from "react";

import "./home.scss";

import type { Api } from "@jellyfin/sdk";
import {
	type BaseItemDto,
	BaseItemKind,
	ItemFields,
	type UserDto,
} from "@jellyfin/sdk/lib/generated-client";
import { getLibraryApi } from "@jellyfin/sdk/lib/utils/api/library-api";
import { getShowApi } from "@jellyfin/sdk/lib/utils/api/show-api";
import { getUserViewApi } from "@jellyfin/sdk/lib/utils/api/user-view-api";
import Typography from "@mui/material/Typography";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ErrorBoundary } from "react-error-boundary";
import { useShallow } from "zustand/shallow";
// Custom Components
import { Card } from "@/components/card/card";
import CardScroller from "@/components/cardScroller/cardScroller";
import Carousel from "@/components/carousel";
import CircularPageLoadingAnimation from "@/components/circularPageLoadingAnimation";
import { LatestMediaSection } from "@/components/layouts/homeSection/latestMediaSection";
import { ErrorNotice } from "@/components/notices/errorNotice/errorNotice";
import {
	getLatestItemsQueryOptions,
	getLibraryLatestQueryOptions,
} from "@/utils/queries/items";
import { useApiInContext } from "@/utils/store/api";
import { useBackdropStore } from "@/utils/store/backdrop";
import { useCentralStore } from "@/utils/store/central";

const heroItemTypes = new Set<string>([
	BaseItemKind.Movie,
	BaseItemKind.Series,
	BaseItemKind.Episode,
	BaseItemKind.MusicAlbum,
]);

const combineLibraryLatest = (
	results: { data?: BaseItemDto[] | null }[],
): BaseItemDto[][] => results.map((result) => result.data ?? []);

export const Route = createFileRoute("/_api/home/")({
	component: Home,
	pendingComponent: () => <CircularPageLoadingAnimation />,
	loader: ({ context: { api, user, queryClient } }) => {
		if (!api || !user?.Id) return null;
		queryClient.ensureQueryData(getLatestItemsQueryOptions(api, user?.Id));
	},
});

function Home() {
	const api = useApiInContext((s) => s.api);
	const user = useCentralStore((s) => s.currentUser);

	if (!api || !user?.Id) {
		return <CircularPageLoadingAnimation />;
	}

	return <HomeContent api={api} user={user} />;
}

function HomeContent({ api, user }: { api: Api; user: UserDto }) {
	const libraries = useSuspenseQuery({
		queryKey: ["libraries"],
		queryFn: async () => {
			const libs = await getUserViewApi(api).getUserViews({
				userId: user.Id,
			});
			return libs.data;
		},
		networkMode: "always",
	});

	const latestMedia = useSuspenseQuery(
		getLatestItemsQueryOptions(api, user.Id),
	);

	const resumeItemsVideo = useSuspenseQuery({
		queryKey: ["home", "resume", "video"],
		queryFn: async () => {
			const resumeItems = await getLibraryApi(api).getResumeItems({
				userId: user.Id,
				limit: 10,
				mediaTypes: ["Video"],
				enableUserData: true,
				fields: [ItemFields.MediaStreams, ItemFields.MediaSources],
			});
			return resumeItems.data;
		},
	});

	const resumeItemsAudio = useSuspenseQuery({
		queryKey: ["home", "resume", "audio"],
		queryFn: async () => {
			const resumeItems = await getLibraryApi(api).getResumeItems({
				userId: user.Id,
				limit: 10,
				mediaTypes: ["Audio"],
				enableUserData: true,
				fields: [ItemFields.MediaStreams, ItemFields.MediaSources],
			});
			return resumeItems.data;
		},
	});

	const upNextItems = useSuspenseQuery({
		queryKey: ["home", "upNext"],
		queryFn: async () => {
			const upNext = await getShowApi(api).getNextUp({
				userId: user.Id,
				fields: [
					ItemFields.PrimaryImageAspectRatio,
					ItemFields.MediaStreams,
					ItemFields.MediaSources,
					ItemFields.ParentId,
				],
				enableResumable: false,
				enableRewatching: false,
				limit: 10,
			});
			return upNext.data;
		},
	});

	const excludeTypes = ["boxsets", "playlists", "livetv", "channels"];
	const latestMediaLibs = useMemo(() => {
		if (libraries.data?.Items?.length) {
			return libraries.data?.Items?.reduce(
				(filteredItems: BaseItemDto[], currentItem) => {
					if (currentItem.Type && !excludeTypes.includes(currentItem.Type)) {
						filteredItems.push(currentItem);
					}
					return filteredItems;
				},
				[],
			);
		}
	}, [libraries.data?.Items?.length]);

	// The per-library "latest" rows; shares cache entries with LatestMediaSection.
	const libraryLatest = useQueries({
		queries: (latestMediaLibs ?? []).map((lib) =>
			getLibraryLatestQueryOptions(api, user.Id, lib.Id),
		),
		combine: combineLibraryLatest,
	});

	// Some servers return nothing for the global /Items/Latest query, so fall back to
	// interleaving the per-library results (each already newest-first).
	const heroItems = useMemo(() => {
		if (latestMedia.data?.length) return latestMedia.data;
		const items: BaseItemDto[] = [];
		const longest = Math.max(0, ...libraryLatest.map((list) => list.length));
		for (let index = 0; index < longest; index++) {
			for (const list of libraryLatest) {
				const item = list[index];
				if (item?.Type && heroItemTypes.has(item.Type)) items.push(item);
			}
		}
		return items.slice(0, 16);
	}, [latestMedia.data, libraryLatest]);

	const navigate = useNavigate();

	const setBackdrop = useBackdropStore(useShallow((s) => s.setBackdrop));

	const setBackdropForItem = useCallback(
		(item: BaseItemDto) => {
			if (item?.ParentBackdropImageTags) {
				setBackdrop(
					item.ImageBlurHashes?.Backdrop?.[item.ParentBackdropImageTags[0]],
				);
			} else {
				if (!item?.BackdropImageTags) {
					setBackdrop(undefined);
					return;
				}
				setBackdrop(
					item.ImageBlurHashes?.Backdrop?.[item.BackdropImageTags[0]],
				);
			}
		},
		[setBackdrop],
	);

	const handleOnChangeCarousel = useCallback(
		(now: number) => {
			const currentItem = heroItems[now];
			if (currentItem) setBackdropForItem(currentItem);
		},
		[heroItems, setBackdropForItem],
	);

	return (
		<main
			className="scrollY home padded-top"
			style={{
				flexGrow: 1,
				position: "relative",
			}}
		>
			<ErrorBoundary FallbackComponent={ErrorNotice}>
				{heroItems.length > 0 && (
					<Carousel content={heroItems} onChange={handleOnChangeCarousel} />
				)}
			</ErrorBoundary>

			<ErrorBoundary
				fallback={
					<div className="error">
						<Typography>Error with Carousel</Typography>
					</div>
				}
			>
				<CardScroller displayCards={4} title="Libraries">
					{libraries.data?.Items?.map((item) => {
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
										navigate({ to: "/library/$id", params: { id: item.Id } });
									}
								}}
								overrideIcon={item.CollectionType}
							/>
						);
					})}
				</CardScroller>
			</ErrorBoundary>
			<ErrorBoundary
				fallback={
					<div className="error">
						<Typography>Error with Libraries</Typography>
					</div>
				}
			>
				{upNextItems.isSuccess && upNextItems.data?.TotalRecordCount && (
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
				{resumeItemsVideo.isSuccess &&
				!resumeItemsVideo.data?.TotalRecordCount ? (
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
				{resumeItemsAudio.isSuccess &&
				!resumeItemsAudio.data?.TotalRecordCount ? (
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
	);
}

export default Home;
