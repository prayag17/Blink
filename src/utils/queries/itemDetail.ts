import type { Api } from "@jellyfin/sdk";
import {
	type BaseItemDto,
	BaseItemKind,
	ItemFields,
	LocationType,
} from "@jellyfin/sdk/lib/generated-client";
import { getLibraryApi } from "@jellyfin/sdk/lib/utils/api/library-api";
import { getShowApi } from "@jellyfin/sdk/lib/utils/api/show-api";
import { type QueryClient, queryOptions } from "@tanstack/react-query";

/**
 * Query options shared by the unified `/item/$id` route loader and its sections,
 * so data prefetched in the loader is picked up by the components.
 */

export const getSimilarItemsQueryOptions = (
	api: Api | undefined,
	userId: string | undefined,
	id: string,
	type: BaseItemKind | undefined,
) =>
	queryOptions({
		queryKey: ["item", id, "similarItem"],
		queryFn: async () => {
			if (!api) return null;
			const request = { userId, itemId: id, limit: 16 };
			const result =
				type === BaseItemKind.Series
					? await getLibraryApi(api).getSimilarShows(request)
					: await getLibraryApi(api).getSimilarItems(request);
			return result.data;
		},
		networkMode: "always",
	});

export const getSeasonsQueryOptions = (
	api: Api | undefined,
	userId: string | undefined,
	seriesId: string,
) =>
	queryOptions({
		queryKey: ["item", seriesId, "seasons"],
		queryFn: async () => {
			if (!api) return null;
			const result = await getShowApi(api).getSeasons({
				userId,
				seriesId,
				isMissing: false,
			});
			return result.data;
		},
	});

export const getSpecialFeaturesQueryOptions = (
	api: Api | undefined,
	userId: string | undefined,
	id: string,
) =>
	queryOptions({
		queryKey: ["item", id, "specialFeatures"],
		queryFn: async () => {
			if (!api) return null;
			const result = await getLibraryApi(api).getSpecialFeatures({
				itemId: id,
				userId,
			});
			return result.data;
		},
	});

export const getCollectionItemsQueryOptions = (
	api: Api | undefined,
	userId: string | undefined,
	id: string,
) =>
	queryOptions({
		queryKey: ["item", id, "collection"],
		queryFn: async () => {
			if (!api) return null;
			const result = await getLibraryApi(api).getItems({
				userId,
				parentId: id,
				fields: [ItemFields.SeasonUserData, ItemFields.Overview],
				excludeLocationTypes: [LocationType.Virtual],
			});
			return result.data;
		},
		networkMode: "always",
	});

export const getUpcomingEpisodesQueryOptions = (
	api: Api | undefined,
	userId: string | undefined,
	episode: BaseItemDto,
) =>
	queryOptions({
		queryKey: ["item", episode.Id ?? "", "episode", "upcomingEpisodes"],
		queryFn: async () => {
			if (!api) return null;
			const result = await getLibraryApi(api).getItems({
				userId,
				parentId: episode.ParentId ?? "",
				startIndex: episode.IndexNumber ?? 0,
				excludeLocationTypes: [LocationType.Virtual],
			});
			return result.data;
		},
		networkMode: "always",
	});

export const personTabs = [
	{ title: "Movies", key: "personMovies", kind: BaseItemKind.Movie },
	{ title: "TV Shows", key: "personShows", kind: BaseItemKind.Series },
	{ title: "Books", key: "personBooks", kind: BaseItemKind.Book },
	{ title: "Photos", key: "personPhotos", kind: BaseItemKind.Photo },
	{ title: "Episodes", key: "personEpisodes", kind: BaseItemKind.Episode },
] as const;

export type PersonTab = (typeof personTabs)[number];

export const getPersonItemsQueryOptions = (
	api: Api | undefined,
	userId: string | undefined,
	personId: string,
	tab: PersonTab,
) =>
	queryOptions({
		queryKey: ["item", personId, tab.key],
		queryFn: async () => {
			if (!api) return null;
			const result = await getLibraryApi(api).getItems({
				userId,
				personIds: [personId],
				includeItemTypes: [tab.kind],
				recursive: true,
				fields:
					tab.kind === BaseItemKind.Episode
						? [ItemFields.SeasonUserData, ItemFields.Overview]
						: undefined,
				sortBy: ["PremiereDate", "ProductionYear", "SortName"],
				sortOrder:
					tab.kind === BaseItemKind.Photo || tab.kind === BaseItemKind.Episode
						? undefined
						: ["Descending"],
				excludeLocationTypes: [LocationType.Virtual],
			});
			return result.data;
		},
		networkMode: "always",
	});

/**
 * Starts fetching the data a given item type's page needs. Safe to call before the
 * item itself has loaded (when the type is known from a link hint).
 */
export const prefetchItemDetail = (
	queryClient: QueryClient,
	api: Api,
	userId: string,
	id: string,
	type: BaseItemKind | undefined,
) => {
	switch (type) {
		case BaseItemKind.Person:
			for (const tab of personTabs) {
				queryClient.prefetchQuery(
					getPersonItemsQueryOptions(api, userId, id, tab),
				);
			}
			return;
		case BaseItemKind.Episode:
			// Upcoming episodes depend on the episode's parent, so they are prefetched once it loads.
			return;
		case BaseItemKind.Series:
			queryClient.prefetchQuery(getSeasonsQueryOptions(api, userId, id));
			queryClient.prefetchQuery(
				getSpecialFeaturesQueryOptions(api, userId, id),
			);
			break;
		case BaseItemKind.BoxSet:
			queryClient.prefetchQuery(
				getCollectionItemsQueryOptions(api, userId, id),
			);
			break;
	}
	queryClient.prefetchQuery(getSimilarItemsQueryOptions(api, userId, id, type));
};
