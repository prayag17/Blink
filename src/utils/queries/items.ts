import type { Api } from "@jellyfin/sdk";
import {
	BaseItemKind,
	ItemFields,
	ItemSortBy,
	LocationType,
	SortOrder,
} from "@jellyfin/sdk/lib/generated-client";
import { getLibraryApi } from "@jellyfin/sdk/lib/utils/api/library-api";
import { queryOptions } from "@tanstack/react-query";

/**
 * @param id itemId
 * @param api api instance
 * @param userId user's id
 * @returns query options for the item
 * @description This function returns the query options for the item. It uses the getUserLibraryApi to get the item data.
 */
export const getItemQueryOptions = (
	id: string,
	api: Api | null | undefined,
	userId: string | null | undefined,
) =>
	queryOptions({
		queryKey: ["item", id],
		queryFn: async () => {
			if (!api) {
				throw Error("API is not defined");
			}
			if (!userId) {
				throw Error("User ID is not defined");
			}
			const result = await getLibraryApi(api).getItem({
				userId: userId,
				itemId: id,
			});
			return result.data;
		},
	});

/**
 * @param api api instance
 * @param userId user's id
 * @returns query options for the latest items
 * @description This function returns the query options for the latest items. It uses the getUserLibraryApi to get the latest items data.
 */
export const getLatestItemsQueryOptions = (
	api: Api | null | undefined,
	userId: string | null | undefined,
) =>
	queryOptions({
		queryKey: ["home", "latestMedia"],
		queryFn: async () => {
			if (!api) {
				throw Error("API is not defined");
			}
			if (!userId) {
				throw Error("User ID is not defined");
			}
			const request = {
				userId: userId,
				fields: [
					ItemFields.Overview,
					ItemFields.ParentId,
					ItemFields.SeasonUserData,
					ItemFields.IsHd,
					ItemFields.MediaStreams,
					ItemFields.MediaSources,
				],
				includeItemTypes: [BaseItemKind.Movie, BaseItemKind.Series],
				enableUserData: true,
				enableImages: true,
			};
			const media = await getLibraryApi(api).getLatestMedia(request);
			if (media.data.length > 0) {
				return media.data;
			}
			// Jellyfin 12 returns nothing for /Items/Latest without a parentId, so fall back
			// to the most recently added movies and series.
			const recent = await getLibraryApi(api).getItems({
				...request,
				recursive: true,
				sortBy: [ItemSortBy.DateCreated],
				sortOrder: [SortOrder.Descending],
				excludeLocationTypes: [LocationType.Virtual],
				limit: 16,
			});
			return recent.data.Items ?? [];
		},
	});

/**
 * @param api api instance
 * @param userId user's id
 * @param libraryId the library (user view) id
 * @returns query options for the latest items of a single library
 */
export const getLibraryLatestQueryOptions = (
	api: Api | null | undefined,
	userId: string | null | undefined,
	libraryId: string | null | undefined,
) =>
	queryOptions({
		queryKey: ["home", "latestMedia", libraryId],
		queryFn: async () => {
			if (!api || !userId) return null;
			const media = await getLibraryApi(api).getLatestMedia({
				userId,
				parentId: libraryId ?? undefined,
				limit: 16,
				fields: [ItemFields.PrimaryImageAspectRatio, ItemFields.ParentId],
			});
			return media.data;
		},
		enabled: !!userId,
	});
