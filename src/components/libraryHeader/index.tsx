import type { BaseItemKind } from "@jellyfin/sdk/lib/generated-client";
import { ItemSortBy, SortOrder } from "@jellyfin/sdk/lib/generated-client";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import {
	AppBar,
	Chip,
	IconButton,
	MenuItem,
	TextField,
	Typography,
	useScrollTrigger,
} from "@mui/material";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import type { ChangeEvent } from "react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/shallow";
import { AVAILABLE_VIEWS, SORT_BY_OPTIONS } from "@/utils/constants/library";
import { getLibraryQueryOptions } from "@/utils/queries/library";
// import removed: header reads name/count from Zustand slice
import { useLibraryStateStore } from "@/utils/store/libraryState";
import useSearchStore from "@/utils/store/search";
import { NavigationDrawer } from "../appBar/navigationDrawer";
import BackButton from "../buttons/backButton";
import { FiltersDialogTrigger } from "../filtersDialog";
import { UserAvatarMenu } from "../userAvatarMenu";
import "./libraryHeader.scss";

const route = getRouteApi("/_api/library/$id");

const MemoizeBackButton = React.memo(BackButton);

export const LibraryHeader = () => {
	const { id: currentLibraryId } = route.useParams();
	const { api, user } = route.useRouteContext();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	// Zustand library state (selected via shallow comparator)
	const {
		currentViewType,
		storeSortBy,
		storeSortAscending,
		filters,
		vts,
		nameStartsWith,
		genreIds,
		libraryNameFromStore,
		itemsTotalCount,
	} = useLibraryStateStore(
		useShallow((s) => {
			const slice = s.libraries[currentLibraryId || ""];
			return {
				currentViewType: slice?.currentViewType,
				storeSortBy: slice?.sortBy,
				storeSortAscending: slice?.sortAscending,
				filters: slice?.filters,
				vts: slice?.videoTypesState,
				nameStartsWith: slice?.nameStartsWith,
				genreIds: slice?.genreIds,
				libraryNameFromStore: slice?.libraryName,
				itemsTotalCount: slice?.itemsTotalCount,
			};
		}),
	);
	const { initLibrary, updateLibrary } = useLibraryStateStore(
		useShallow((s) => ({
			initLibrary: s.initLibrary,
			updateLibrary: s.updateLibrary,
		})),
	);

	useEffect(() => {
		if (!currentLibraryId) return;
		// If the slice isn't initialized, these fields will be undefined
		if (
			currentViewType === undefined &&
			storeSortBy === undefined &&
			storeSortAscending === undefined
		) {
			initLibrary(currentLibraryId, {
				sortBy: ItemSortBy.Name,
				sortAscending: true,
			});
		}
	}, [
		currentLibraryId,
		currentViewType,
		storeSortBy,
		storeSortAscending,
		initLibrary,
	]);
	const currentLibrary = useSuspenseQuery(
		getLibraryQueryOptions(api, user?.Id, currentLibraryId),
	);
	const scrollTrigger = useScrollTrigger({
		disableHysteresis: true,
		threshold: 20,
	});

	const compatibleViews = useMemo(
		() =>
			AVAILABLE_VIEWS.filter((v) =>
				v.compatibleCollectionTypes.includes(
					currentLibrary.data.CollectionType as any,
				),
			),
		[currentLibrary.data.CollectionType],
	);
	// Values from store
	const sortBy = (storeSortBy ?? ItemSortBy.Name) as string;
	const sortAscending = storeSortAscending ?? true;
	const effectiveViewType = currentViewType as any;
	const effectiveSortByRaw = sortBy;
	const effectiveSortAscending = sortAscending;

	const normalizedViewType = useMemo(() => {
		const values = compatibleViews.map((v) => v.value);
		if (effectiveViewType && values.includes(effectiveViewType as any))
			return effectiveViewType as any;
		return values[0] as BaseItemKind | "Artist";
	}, [effectiveViewType, compatibleViews]);

	const normalizedSortBy = useMemo(() => {
		const compatibleOptions = SORT_BY_OPTIONS.filter(
			(option) =>
				option.compatibleViewTypes?.includes(normalizedViewType as any) ||
				option.compatibleCollectionTypes?.includes(
					currentLibrary.data.CollectionType as any,
				),
		);
		const compatibleValues = compatibleOptions.map((opt) =>
			Array.isArray(opt.value) ? opt.value.join(",") : String(opt.value),
		);
		const current = String(effectiveSortByRaw ?? "");
		if (current && compatibleValues.includes(current)) return current;
		return compatibleValues[0] ?? String(ItemSortBy.Name);
	}, [
		effectiveSortByRaw,
		normalizedViewType,
		currentLibrary.data.CollectionType,
	]);

	const handleChangeViewType = (e: ChangeEvent<HTMLInputElement>) => {
		const next = e.target.value as unknown as BaseItemKind | "Artist";
		if (currentLibraryId)
			updateLibrary(currentLibraryId, { currentViewType: next });
	};
	const handleChangeSortBy = (e: ChangeEvent<HTMLInputElement>) => {
		const next = e.target.value as unknown as string;
		if (currentLibraryId) updateLibrary(currentLibraryId, { sortBy: next });
	};
	const handleSortAscendingToggle = () => {
		if (currentLibraryId)
			updateLibrary(currentLibraryId, {
				sortAscending: !effectiveSortAscending,
			});
	};

	// (Video type multi-select temporarily removed; logic cleaned to reduce overhead.)

	// Prefetch helpers to reduce perceived latency on sort changes
	// filters, vts, nameStartsWith, genreIds are already selected above
	// Prefetch handler will be attached on menu items below
	const prefetchItems = useCallback(
		async (sortByValue: string, asc: boolean) => {
			if (!api || !user?.Id || !currentLibraryId || !normalizedViewType) return;
			const key = [
				"library",
				"items",
				currentLibraryId,
				{
					currentViewType: normalizedViewType,
					sortAscending: asc,
					sortBy: sortByValue,
					filters,
					videoTypesState: vts,
					nameStartsWith,
					genreIds,
				},
			] as const;
			await queryClient.prefetchQuery({
				queryKey: key,
				queryFn: async () => {
					const result = await getItemsApi(api).getItems({
						userId: user.Id!,
						parentId: currentLibraryId,
						recursive: true,
						includeItemTypes: [normalizedViewType as any],
						sortOrder: [asc ? SortOrder.Ascending : SortOrder.Descending],
						sortBy: String(sortByValue).split(",") as any,
						enableUserData: true,
						nameStartsWith: nameStartsWith || undefined,
						genreIds: genreIds && genreIds.length > 0 ? genreIds : undefined,
					});
					return result.data;
				},
				staleTime: 5_000,
			});
		},
		[
			api,
			user?.Id,
			currentLibraryId,
			normalizedViewType,
			filters,
			vts,
			nameStartsWith,
			genreIds,
			queryClient,
		],
	);

	const disableSortOption = useMemo(
		() =>
			!normalizedViewType ||
			!SORT_BY_OPTIONS.some(
				(option) =>
					option.compatibleViewTypes?.includes(normalizedViewType as any) ||
					option.compatibleCollectionTypes?.includes(
						currentLibrary.data.CollectionType as any,
					),
			),
		[normalizedViewType, currentLibrary.data.CollectionType],
	);

	const appBarStyling = useMemo(
		() => ({ backgroundColor: "transparent", paddingRight: "0 !important" }),
		[],
	);

	// Read values from Zustand: name set by route, count set by grid
	const libraryName = libraryNameFromStore ?? currentLibrary.data.Name;
	const totalCount = itemsTotalCount;

	const toggleSearchDialog = useSearchStore(
		useShallow((s) => s.toggleSearchDialog),
	);
	const handleNavigateToHome = useCallback(
		() => navigate({ to: "/home" }),
		[navigate],
	);
	const handleNavigateToFavorite = useCallback(
		() => navigate({ to: "/favorite" }),
		[navigate],
	);

	const [showDrawer, setShowDrawer] = useState(false);

	const handleDrawerClose = useCallback(() => {
		setShowDrawer(false);
	}, []);

	const handleDrawerOpen = useCallback(() => {
		setShowDrawer(true);
	}, []);

	return (
		<>
			<AppBar
				className={
					scrollTrigger
						? "library-header scrolling flex flex-row"
						: "library-header flex flex-row"
				}
				style={appBarStyling}
				elevation={0}
				color="transparent"
			>
				<div className="flex flex-row" style={{ gap: "0.6em" }}>
					<IconButton onClick={handleDrawerOpen}>
						<div className="material-symbols-rounded">menu</div>
					</IconButton>
					<MemoizeBackButton />
					<IconButton onClick={handleNavigateToHome}>
						<div
							className={
								location.pathname === "/home"
									? "material-symbols-rounded fill"
									: "material-symbols-rounded"
							}
						>
							home
						</div>
					</IconButton>
				</div>
				<div
					className="flex flex-row library-header-center"
					style={{ gap: "0.6em" }}
				>
					<div
						className="library-title-count flex flex-row flex-align-center"
						title={`${libraryName}${typeof totalCount === "number" ? ` · ${totalCount.toLocaleString()} items` : ""}`}
					>
						<Typography variant="subtitle1" noWrap align="center">
							{libraryName}
						</Typography>
						{typeof totalCount === "number" && (
							<Chip label={totalCount} sx={{ px: 0.5, ml: 1 }} />
						)}
					</div>
					<TextField
						select
						size="small"
						value={String(normalizedViewType)}
						onChange={handleChangeViewType}
						SelectProps={{
							MenuProps: {
								PaperProps: {
									className: "glass-menu-paper",
								},
							},
						}}
					>
						<MenuItem disabled value="">
							<Typography variant="overline" color="textSecondary">
								View
							</Typography>
						</MenuItem>
						{compatibleViews.map((v) => (
							<MenuItem key={String(v.value)} value={String(v.value)}>
								{v.title}
							</MenuItem>
						))}
					</TextField>
					<IconButton
						onClick={handleSortAscendingToggle}
						aria-label="Toggle sort order"
					>
						<div
							className="material-symbols-rounded"
							style={{
								transform: sortAscending ? "rotateX(0deg)" : "rotateX(180deg)",
							}}
						>
							sort
						</div>
					</IconButton>
					<TextField
						select
						size="small"
						value={normalizedSortBy}
						onChange={handleChangeSortBy}
						disabled={disableSortOption}
						SelectProps={{
							MenuProps: {
								PaperProps: {
									className: "glass-menu-paper",
								},
							},
						}}
					>
						<MenuItem disabled value="">
							<Typography variant="overline" color="textSecondary">
								Sort By
							</Typography>
						</MenuItem>
						{SORT_BY_OPTIONS.map((option) => {
							const isCompatible =
								option.compatibleViewTypes?.includes(currentViewType as any) ||
								option.compatibleCollectionTypes?.includes(
									currentLibrary.data.CollectionType as any,
								);
							if (!isCompatible) return null;
							const valueStr = Array.isArray(option.value)
								? option.value.join(",")
								: option.value;
							return (
								<MenuItem
									key={
										Array.isArray(option.value)
											? option.value.join(",")
											: option.value
									}
									value={valueStr}
									onMouseEnter={() =>
										prefetchItems(String(valueStr), sortAscending)
									}
								>
									{option.title}
								</MenuItem>
							);
						})}
					</TextField>
					<FiltersDialogTrigger />
				</div>
				<div className="flex flex-row" style={{ gap: "0.6em" }}>
					<IconButton onClick={toggleSearchDialog}>
						<div className="material-symbols-rounded">search</div>
					</IconButton>
					<IconButton onClick={handleNavigateToFavorite}>
						<div className="material-symbols-rounded">favorite</div>
					</IconButton>
					<UserAvatarMenu />
				</div>
			</AppBar>
			<NavigationDrawer open={showDrawer} onClose={handleDrawerClose} />
		</>
	);
};
