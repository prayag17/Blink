import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client";
import { useScrollTrigger } from "@mui/material";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import React, { type ChangeEvent, useMemo } from "react";
import {
	AVAILABLE_VIEWS,
	type FILTERS,
	SORT_BY_OPTIONS,
} from "@/utils/constants/library";
import { getLibraryQueryOptions } from "@/utils/queries/library";

const route = getRouteApi("/_api/library/$id");

const LibraryMenu = () => {
	const { currentViewType, sortAscending, filters, sortBy } = route.useSearch();
	const { id: currentLibraryId } = route.useParams();
	const { api, user } = route.useRouteContext();
	const currentLibrary = useSuspenseQuery(
		getLibraryQueryOptions(api, user?.Id, currentLibraryId),
	);
	const scrollTrigger = useScrollTrigger({
		disableHysteresis: true,
		threshold: 20,
	});
	const navigate = useNavigate();
	const _handleSortAsecendingToggle = () => {
		navigate({
			search: {
				sortAscending: !sortAscending,
				sortBy,
			},
			to: "/library/$id",
			params: {
				id: currentLibraryId ?? "",
			},
		});
	};
	const _handleChangeSortBy = () => {
		navigate({
			search: {
				sortBy,
			},
			to: "/library/$id",
			params: {
				id: currentLibraryId ?? "",
			},
		});
	};
	const _handleChangeCurrentViewType = (viewType: BaseItemKind) => {
		navigate({
			search: {
				currentViewType: viewType,
			},
			to: "/library/$id",
			params: {
				id: currentLibraryId ?? "",
			},
		});
	};

	const [filterButtonAnchorEl, setFilterButtonAnchorEl] =
		React.useState<null | HTMLElement>(null);
	const _filterMenuOpen = useMemo(
		() => Boolean(filterButtonAnchorEl),
		[filterButtonAnchorEl],
	);
	const _handleFilterDropdown = (event: React.MouseEvent<HTMLElement>) => {
		setFilterButtonAnchorEl(event.currentTarget);
	};

	const _handleFilterChange = (key: FILTERS, value: boolean) => {
		// Update filter state and navigate
		navigate({
			search: {
				filters: { ...filters, [key]: value },
			},
			to: "/library/$id",
			params: {
				id: currentLibraryId ?? "",
			},
		});
		// Close the filter menu
		setFilterButtonAnchorEl(null);
	};

	const _disableSortOption = useMemo(() => {
		return (
			!currentViewType ||
			!SORT_BY_OPTIONS.some(
				(option) =>
					option.compatibleViewTypes?.includes(currentViewType as any) ||
					option.compatibleCollectionTypes?.includes(
						currentLibrary.data.CollectionType as any,
					),
			)
		);
	}, [currentViewType, currentLibrary.data.CollectionType]);
	const _disableFilters = useMemo(() => {
		switch (currentViewType) {
			case BaseItemKind.Movie:
			case BaseItemKind.Audio:
			case BaseItemKind.Series:
			case BaseItemKind.BoxSet:
				return false;
			default:
				return true;
		}
	}, [currentViewType]);

	if (!filters) {
		return null;
	}

	return (
		<div
			className={
				scrollTrigger
					? "library-items-header glass scrolling"
					: "library-items-header"
			}
		/>
	);
};

export default LibraryMenu;
