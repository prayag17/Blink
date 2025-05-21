import type { Api } from "@jellyfin/sdk";
import { BaseItemKind, ItemFields } from "@jellyfin/sdk/lib/generated-client";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
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
			if (!api || !userId) {
				throw Error("API or User ID is not defined");
			}
			const result = await getUserLibraryApi(api).getItem({
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
			if (!api || !userId) {
				throw Error("API or User ID is not defined");
			}
			const media = await getUserLibraryApi(api).getLatestMedia({
				userId: userId,
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
	});
