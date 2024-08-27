import type {
	BaseItemKind,
	ItemSortBy,
} from "@jellyfin/sdk/lib/generated-client";
import { createFileRoute } from "@tanstack/react-router";

type LibraryParamType = {
	currentViewType: BaseItemKind;
	sortAscending: boolean;
	sortBy: ItemSortBy;
	filters: {
		isPlayed: boolean;
		isUnPlayed: boolean;
		isResumable: boolean;
		isFavorite: boolean;
		isLiked: boolean;
		isUnliked: boolean;
		hasSubtitles: boolean;
		hasTrailer: boolean;
		hasSpecialFeature: boolean;
		hasThemeSong: boolean;
		hasThemeVideo: boolean;
		isBluRay: boolean;
		isDVD: boolean;
		isHD: undefined | boolean;
		isSD: boolean;
		is4K: boolean;
		is3D: boolean;
	};
};

export const Route = createFileRoute("/_api/library")({
	validateSearch: (search: Record<string, any>): LibraryParamType => {
		return {
			currentViewType: search.viewType,
			sortAscending: search.sortAscending,
			sortBy: search.sortBy,
			filters: search.filters,
		};
	},
});