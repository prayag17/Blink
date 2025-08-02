import {
	type BaseItemDtoQueryResult,
	BaseItemKind,
	ItemFilter,
	type ItemSortBy,
	SortOrder,
	VideoType,
} from "@jellyfin/sdk/lib/generated-client";
import { getArtistsApi } from "@jellyfin/sdk/lib/utils/api/artists-api";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getPersonsApi } from "@jellyfin/sdk/lib/utils/api/persons-api";
import { getStudiosApi } from "@jellyfin/sdk/lib/utils/api/studios-api";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import type { AxiosResponse } from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/shallow";
import { getLibraryQueryOptions } from "@/utils/queries/library";
import { useApiInContext } from "@/utils/store/api";
import { useBackdropStore } from "@/utils/store/backdrop";
import { useCentralStore } from "@/utils/store/central";
import { Card } from "../card/card";

const libraryRoute = getRouteApi("/_api/library/$id");

const LibraryItemsGrid = () => {
	const api = useApiInContext((s) => s.api);
	const user = useCentralStore((s) => s.currentUser);
	const {
		currentViewType,
		sortAscending = true,
		sortBy = "SortName",
		filters = {},
		videoTypesState = {},
	} = libraryRoute.useSearch();
	const currentLibraryId = libraryRoute.useParams().id;
	const currentLibrary = useSuspenseQuery(
		getLibraryQueryOptions(api, user?.Id, currentLibraryId),
	);
	const items = useSuspenseQuery({
		queryKey: [
			"library",
			"items",
			currentLibraryId,
			{
				currentViewType: currentViewType,
				sortAscending: sortAscending,
				sortBy: sortBy,
				filters,
				videoTypesState,
				// genreFilter,
			},
		],
		queryFn: async () => {
			if (!api) return null;
			let result: AxiosResponse<BaseItemDtoQueryResult, any>;
			if (currentViewType === "MusicArtist") {
				result = await getArtistsApi(api).getAlbumArtists({
					userId: user?.Id,
					parentId: currentLibraryId,
				});
			} else if (currentViewType === "Artist") {
				result = await getArtistsApi(api).getArtists({
					userId: user?.Id,
					parentId: currentLibraryId,
				});
			} else if (currentViewType === "Person") {
				result = await getPersonsApi(api).getPersons({
					userId: user?.Id,
					personTypes: ["Actor"],
				});
			} else if (currentViewType === "Studio") {
				result = await getStudiosApi(api).getStudios({
					userId: user?.Id,
					parentId: currentLibraryId,
				});
			} else if (currentViewType === "BoxSet") {
				const videoTypes: VideoType[] = [];
				if (videoTypesState.BluRay) videoTypes.push(VideoType.BluRay);
				if (videoTypesState.Dvd) videoTypes.push(VideoType.Dvd);
				if (videoTypesState.Iso) videoTypes.push(VideoType.Iso);
				if (videoTypesState.VideoFile) videoTypes.push(VideoType.VideoFile);

				const filtersArray: ItemFilter[] = [];
				if (filters.isPlayed) filtersArray.push(ItemFilter.IsPlayed);
				if (filters.isUnPlayed) filtersArray.push(ItemFilter.IsUnplayed);
				if (filters.isResumable) filtersArray.push(ItemFilter.IsResumable);
				if (filters.isFavorite) filtersArray.push(ItemFilter.IsFavorite);

				result = await getItemsApi(api).getItems({
					userId: user?.Id,
					parentId: currentLibraryId,
					recursive:
						currentLibrary.data.CollectionType === "boxsets" ? undefined : true,
					// includeItemTypes: [currentViewType],
					sortOrder: [
						sortAscending ? SortOrder.Ascending : SortOrder.Descending,
					],
					sortBy: sortBy.split(",") as ItemSortBy[],
					filters: filtersArray,
					hasSubtitles: filters.hasSubtitles ? true : undefined,
					hasTrailer: filters.hasTrailer ? true : undefined,
					hasSpecialFeature: filters.hasSpecialFeature ? true : undefined,
					hasThemeSong: filters.hasThemeSong ? true : undefined,
					hasThemeVideo: filters.hasThemeVideo ? true : undefined,
					videoTypes: videoTypes,
					isHd: filters.isSD ? true : filters.isHD || undefined,
					is4K: filters.is4K || undefined,
					is3D: filters.is3D || undefined,
					enableUserData: true,
					// genreIds: genreFilter,
				});
			} else {
				const videoTypes: VideoType[] = [];
				if (videoTypesState.BluRay) videoTypes.push(VideoType.BluRay);
				if (videoTypesState.Dvd) videoTypes.push(VideoType.Dvd);
				if (videoTypesState.Iso) videoTypes.push(VideoType.Iso);
				if (videoTypesState.VideoFile) videoTypes.push(VideoType.VideoFile);

				const filtersArray: ItemFilter[] = [];
				if (filters.isPlayed) filtersArray.push(ItemFilter.IsPlayed);
				if (filters.isUnPlayed) filtersArray.push(ItemFilter.IsUnplayed);
				if (filters.isResumable) filtersArray.push(ItemFilter.IsResumable);
				if (filters.isFavorite) filtersArray.push(ItemFilter.IsFavorite);
				if (!currentViewType) {
					throw new Error("currentViewType is required");
				}
				result = await getItemsApi(api).getItems({
					userId: user?.Id,
					parentId: currentLibraryId,
					recursive: true,
					includeItemTypes: [currentViewType],
					sortOrder: [
						sortAscending ? SortOrder.Ascending : SortOrder.Descending,
					],
					sortBy: sortBy.split(",") as ItemSortBy[],
					filters: filtersArray,
					hasSubtitles: filters.hasSubtitles ? true : undefined,
					hasTrailer: filters.hasTrailer ? true : undefined,
					hasSpecialFeature: filters.hasSpecialFeature ? true : undefined,
					hasThemeSong: filters.hasThemeSong ? true : undefined,
					hasThemeVideo: filters.hasThemeVideo ? true : undefined,
					videoTypes: videoTypes,
					isHd: filters.isSD ? true : filters.isHD || undefined,
					is4K: filters.is4K || undefined,
					is3D: filters.is3D || undefined,
					enableUserData: true,
					// genreIds: genreFilter,
				});
			}
			return result.data;
		},
		networkMode: "always",
	});
	// --- Backdrop ---
	const setBackdrop = useBackdropStore(useShallow((s) => s.setBackdrop));
	const [currentBackdropIndex, setCurrentBackdropIndex] = useState(1);
	const backdropItems = useMemo(() => {
		if (items.isSuccess) {
			const temp = items.data?.Items?.filter(
				(item) => Object.keys(item.ImageBlurHashes?.Backdrop ?? {}).length > 0,
			);
			const backdropItem = temp?.[0];

			const currentBackdropItemHash =
				backdropItem?.ImageBlurHashes?.Backdrop?.[
					Object.keys(backdropItem?.ImageBlurHashes?.Backdrop ?? {})[0]
				];
			setBackdrop(currentBackdropItemHash);

			return temp;
		}
	}, [items]);
	useEffect(() => {
		if (backdropItems?.length === 0 || !api || !backdropItems) {
			return; // No backdrop items available
		}
		const intervalId = setInterval(() => {
			const currentBackdropItemHash =
				backdropItems[currentBackdropIndex].ImageBlurHashes?.Backdrop?.[
					Object.keys(
						backdropItems[currentBackdropIndex].ImageBlurHashes?.Backdrop ?? {},
					)[0]
				];
			if (!currentBackdropItemHash) return; // No backdrop image available
			setBackdrop(currentBackdropItemHash);
			setCurrentBackdropIndex(
				(prevIndex) => (prevIndex + 1) % backdropItems.length,
			);
		}, 10_000); // Update backdrop every 10s
		return () => clearInterval(intervalId);
	}, [backdropItems]);
	return (
		<div className="library-items-container">
			{items.data?.Items?.map((item) => (
				<Card
					item={item}
					key={item?.Id}
					seriesId={item?.SeriesId}
					cardTitle={
						item?.Type === BaseItemKind.Episode ? item.SeriesName : item?.Name
					}
					imageType={"Primary"}
					cardCaption={
						item?.Type === BaseItemKind.Episode
							? `S${item.ParentIndexNumber}:E${item.IndexNumber} - ${item.Name}`
							: item?.Type === BaseItemKind.Series
								? `${item.ProductionYear} - ${
										item.EndDate
											? new Date(item.EndDate).toLocaleString([], {
													year: "numeric",
												})
											: "Present"
									}`
								: item?.ProductionYear
					}
					disableOverlay={
						item?.Type === BaseItemKind.Person ||
						item?.Type === BaseItemKind.Genre ||
						item?.Type === BaseItemKind.MusicGenre ||
						item?.Type === BaseItemKind.Studio
					}
					cardType={
						item?.Type === BaseItemKind.MusicAlbum ||
						item?.Type === BaseItemKind.Audio ||
						item?.Type === BaseItemKind.Genre ||
						item?.Type === BaseItemKind.MusicGenre ||
						item?.Type === BaseItemKind.Studio ||
						item?.Type === BaseItemKind.Playlist
							? "square"
							: "portrait"
					}
					// queryKey={items}
					userId={user?.Id}
				/>
			))}
		</div>
	);
};
export default LibraryItemsGrid;
