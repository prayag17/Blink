import type { Api } from "@jellyfin/sdk";
import type {
	BaseItemDtoQueryResult,
	BaseItemKind,
	ItemSortBy,
} from "@jellyfin/sdk/lib/generated-client";
import {
	ItemFilter,
	SortOrder,
	VideoType,
} from "@jellyfin/sdk/lib/generated-client";
import { getArtistsApi } from "@jellyfin/sdk/lib/utils/api/artists-api";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getPersonsApi } from "@jellyfin/sdk/lib/utils/api/persons-api";
import { getStudiosApi } from "@jellyfin/sdk/lib/utils/api/studios-api";
import { queryOptions } from "@tanstack/react-query";

export interface LibraryItemsParams {
	currentViewType?:
		| BaseItemKind
		| "Artist"
		| "Person"
		| "Studio"
		| "MusicArtist"
		| "BoxSet";
	sortAscending: boolean;
	sortBy: string; // comma separated
	filters?: Record<string, boolean | undefined>;
	videoTypesState?: {
		BluRay?: boolean;
		Dvd?: boolean;
		Iso?: boolean;
		VideoFile?: boolean;
	};
	nameStartsWith?: string;
	genreIds?: string[];
	collectionType?: string; // from library metadata (e.g. boxsets)
	limit?: number; // optional (e.g. 0 for count-only)
}

/** Build TanStack Query options for fetching library items with unified branching logic. */
export const getLibraryItemsQueryOptions = (
	api: Api | null | undefined,
	userId: string | null | undefined,
	libraryId: string | null | undefined,
	params: LibraryItemsParams,
) => {
	return queryOptions<BaseItemDtoQueryResult>({
		enabled: !!params.currentViewType,
		queryKey: [
			"library",
			"items",
			libraryId,
			{
				currentViewType: params.currentViewType,
				sortAscending: params.sortAscending,
				sortBy: params.sortBy,
				filters: params.filters,
				videoTypesState: params.videoTypesState,
				nameStartsWith: params.nameStartsWith,
				genreIds: params.genreIds,
				collectionType: params.collectionType,
				limit: params.limit,
			},
		],
		queryFn: async () => {
			if (!api || !userId || !libraryId || !params.currentViewType) {
				console.warn(
					"getLibraryItemsQueryOptions: Missing required parameters",
					{ api, userId, libraryId, currentViewType: params.currentViewType },
				);
				return { Items: [], TotalRecordCount: 0 } as BaseItemDtoQueryResult;
			}
			console.info("Fetching library items with params:", params);
			const { currentViewType, videoTypesState, filters } = params;
			const buildVideoTypes = (state: typeof videoTypesState) => {
				const videoTypes: VideoType[] = [];
				if (state?.BluRay) videoTypes.push(VideoType.BluRay);
				if (state?.Dvd) videoTypes.push(VideoType.Dvd);
				if (state?.Iso) videoTypes.push(VideoType.Iso);
				if (state?.VideoFile) videoTypes.push(VideoType.VideoFile);
				return videoTypes;
			};
			const buildFilters = (f: typeof filters) => {
				const filtersArray: ItemFilter[] = [];
				if (f?.isPlayed) filtersArray.push(ItemFilter.IsPlayed);
				if (f?.isUnPlayed) filtersArray.push(ItemFilter.IsUnplayed);
				if (f?.isResumable) filtersArray.push(ItemFilter.IsResumable);
				if (f?.isFavorite) filtersArray.push(ItemFilter.IsFavorite);
				return filtersArray;
			};
			let result: { data: BaseItemDtoQueryResult };
			if (currentViewType === "MusicArtist") {
				result = await getArtistsApi(api).getAlbumArtists({
					userId: userId,
					parentId: libraryId,
					limit: params.limit,
				});
			} else if (currentViewType === "Artist") {
				result = await getArtistsApi(api).getArtists({
					userId: userId,
					parentId: libraryId,
					limit: params.limit,
				});
			} else if (currentViewType === "Person") {
				result = await getPersonsApi(api).getPersons({
					userId: userId,
					personTypes: ["Actor"],
					limit: params.limit,
				});
			} else if (currentViewType === "Studio") {
				result = await getStudiosApi(api).getStudios({
					userId: userId,
					parentId: libraryId,
					limit: params.limit,
				});
			} else if (currentViewType === "BoxSet") {
				result = await getItemsApi(api).getItems({
					userId: userId,
					parentId: libraryId,
					recursive: params.collectionType === "boxsets" ? undefined : true,
					sortOrder: [
						params.sortAscending ? SortOrder.Ascending : SortOrder.Descending,
					],
					sortBy: params.sortBy.split(",") as ItemSortBy[],
					filters: buildFilters(filters),
					hasSubtitles: filters?.hasSubtitles ? true : undefined,
					hasTrailer: filters?.hasTrailer ? true : undefined,
					hasSpecialFeature: filters?.hasSpecialFeature ? true : undefined,
					hasThemeSong: filters?.hasThemeSong ? true : undefined,
					hasThemeVideo: filters?.hasThemeVideo ? true : undefined,
					videoTypes: buildVideoTypes(videoTypesState),
					isHd: filters?.isSD ? true : filters?.isHD || undefined,
					is4K: filters?.is4K || undefined,
					is3D: filters?.is3D || undefined,
					enableUserData: true,
					nameStartsWith: params.nameStartsWith || undefined,
					genreIds:
						params.genreIds && params.genreIds.length > 0
							? params.genreIds
							: undefined,
					limit: params.limit,
				});
			} else {
				result = await getItemsApi(api).getItems({
					userId: userId,
					parentId: libraryId,
					recursive: true,
					includeItemTypes: [currentViewType],
					sortOrder: [
						params.sortAscending ? SortOrder.Ascending : SortOrder.Descending,
					],
					sortBy: params.sortBy.split(",") as ItemSortBy[],
					filters: buildFilters(filters),
					hasSubtitles: filters?.hasSubtitles ? true : undefined,
					hasTrailer: filters?.hasTrailer ? true : undefined,
					hasSpecialFeature: filters?.hasSpecialFeature ? true : undefined,
					hasThemeSong: filters?.hasThemeSong ? true : undefined,
					hasThemeVideo: filters?.hasThemeVideo ? true : undefined,
					videoTypes: buildVideoTypes(videoTypesState),
					isHd: filters?.isSD ? true : filters?.isHD || undefined,
					is4K: filters?.is4K || undefined,
					is3D: filters?.is3D || undefined,
					enableUserData: true,
					nameStartsWith: params.nameStartsWith || undefined,
					genreIds:
						params.genreIds && params.genreIds.length > 0
							? params.genreIds
							: undefined,
					limit: params.limit,
				});
			}
			return result.data;
		},
		staleTime: 5_000,
		gcTime: 5 * 60_000,
	});
};
