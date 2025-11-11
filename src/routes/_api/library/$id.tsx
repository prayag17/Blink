import { BaseItemKind, ItemSortBy } from "@jellyfin/sdk/lib/generated-client";
import { useSuspenseQuery } from "@tanstack/react-query";
import React, { Suspense, useEffect } from "react";
import "./library.scss";
import { createFileRoute } from "@tanstack/react-router";
import { useShallow } from "zustand/shallow";
import { AlphaSelector } from "@/components/alphaSelector";
import { LibraryHeader } from "@/components/libraryHeader";
import LibraryItemsGrid from "@/components/libraryItemsGrid";
import LibraryItemsSkeleton from "@/components/skeleton/libraryItems";
import { getDefaultSortByForCollectionType } from "@/utils/constants/library";
import { getLibraryQueryOptions } from "@/utils/queries/library";
import { useApiInContext } from "@/utils/store/api";
import { useCentralStore } from "@/utils/store/central";
import useHeaderStore from "@/utils/store/header";
import { useLibraryStateStore } from "@/utils/store/libraryState";

// type SortByObject = { title: string; value: string };
// type ViewObject = { title: string; value: BaseItemKind | "Artist" };
// type allowedFilters = ["movies", "tvshows", "music", "books"];

export const Route = createFileRoute("/_api/library/$id")({
	component: Library,
});

function Library() {
	const api = useApiInContext((s) => s.api);

	const { id } = Route.useParams();

	const user = useCentralStore((s) => s.currentUser);

	const currentLib = useSuspenseQuery(
		getLibraryQueryOptions(api, user?.Id, id),
	);
	const initLibrary = useLibraryStateStore((s) => s.initLibrary);
	const updateLibrary = useLibraryStateStore((s) => s.updateLibrary);
	const { currentViewType: storeViewType, libraryName: storeLibraryName } =
		useLibraryStateStore(
			useShallow((s) => {
				const sl = s.libraries[id || ""];
				return {
					currentViewType: sl?.currentViewType,
					libraryName: sl?.libraryName,
				} as const;
			}),
		);

	React.useEffect(() => {
		if (!id || !currentLib.data) return;
		// Ensure library name is available in Zustand for header consumption
		updateLibrary(id, { libraryName: currentLib.data.Name ?? undefined });
		const collectionType = currentLib.data.CollectionType;

		const detectedViewType: BaseItemKind | "Artist" =
			collectionType === "music"
				? BaseItemKind.MusicAlbum
				: collectionType === "movies"
					? BaseItemKind.Movie
					: collectionType === "tvshows"
						? BaseItemKind.Series
						: collectionType === "boxsets"
							? BaseItemKind.BoxSet
							: collectionType === "books"
								? BaseItemKind.Book
								: collectionType === "playlists"
									? BaseItemKind.Playlist
									: BaseItemKind.Movie;

		// Initialize defaults if state not yet set
		if (storeViewType === undefined) {
			initLibrary(id, {
				currentViewType: detectedViewType,
				sortBy:
					getDefaultSortByForCollectionType(collectionType as any) ||
					ItemSortBy.Name,
				sortAscending: true,
			});
		}
	}, [id, storeViewType, initLibrary, updateLibrary, currentLib.data]);

	const { setPageTitle } = useHeaderStore(
		useShallow((state) => ({
			setPageTitle: state.setPageTitle,
		})),
	);
	// Derive top app title from Zustand slice (library name)
	useEffect(() => {
		const title = storeLibraryName ?? "Library";
		setPageTitle(title);
	}, [storeLibraryName, setPageTitle]);

	/* if (!id) {
		// show loading if any route param is missing
		return <LoadingIndicator />;
	} */

	return (
		<main className="scrollY library padded-top">
			<LibraryHeader />

			<Suspense fallback={<LibraryItemsSkeleton />}>
				<div className="library-items">
					<LibraryItemsGrid />
				</div>
				<div style={{ position: "fixed", right: 14, top: 80 }}>
					<AlphaSelector />
				</div>
			</Suspense>
		</main>
	);
}

// 	const genres = useQuery({
	// 		queryKey: ["library", "genreItem", id],
	// 		queryFn: async () => {
	// 			if (!api) return null;
	// 			if (currentLib.data?.CollectionType === "music") {
	// 				const result = await getMusicGenresApi(api).getMusicGenres({
	// 					parentId: id,
	// 					userId: user?.Id,
	// 				});
	// 				return result.data;
	// 			}
	// 			const result = await getGenresApi(api).getGenres({
	// 				parentId: id,
	// 				userId: user?.Id,
	// 			});
	// 			return result.data;
	// 		},
	// 	});

	// 	const [genreFilter, setGenreFilter] = useState<string[]>(() => {
	// 		const cachedVal = sessionStorage.getItem(
	// 			`library-${currentLib.data?.Id}-config_genreFilter`,
	// 		);
	// 		if (cachedVal) {
	// 			return JSON.parse(cachedVal);
	// 		}
	// 		return [];
	// 	});
	// 	const _handleGenreFilter = useCallback(
	// 		(e: ChangeEvent<HTMLInputElement>, genre: BaseItemDto) => {
	// 			if (e.target.checked) {
	// 				const genreFilterTemp = [...genreFilter, genre.Id];
	// 				setGenreFilter((s) => (genre.Id ? [...s, genre.Id] : s));
	// 				sessionStorage.setItem(
	// 					`library-${currentLib.data?.Id}-config_genreFilter`,
	// 					JSON.stringify(genreFilterTemp),
	// 				);
	// 			} else {
	// 				const genreFilterTemp = genreFilter.filter((id) => id !== genre.Id);
	// 				setGenreFilter((s) => s.filter((id) => id !== genre.Id));
	// 				sessionStorage.setItem(
	// 					`library-${currentLib.data?.Id}-config_genreFilter`,
	// 					JSON.stringify(genreFilterTemp),
	// 				);
	// 			}
	// 		},
	// 		[genres.data?.Items?.length, id],
	// 	);

	// 	const [currentViewType, setCurrentViewType] = useState<
	// 		BaseItemKind | "Artist"
	// 	>(undefined!);

	// 	// DONE
	// 	const _availableViewTypes: ViewObject[] = useMemo(() => {
	// 		const result: ViewObject[] = undefined!;

	// 		if (
	// 			sessionStorage.getItem(
	// 				`library-${currentLib.data?.Id}-config_currentViewType`,
	// 			)
	// 		) {
	// 			setCurrentViewType(
	// 				sessionStorage.getItem(
	// 					`library-${currentLib.data?.Id}-config_currentViewType`,
	// 				) as BaseItemKind | "Artist",
	// 			);
	// 		} else {
	// 			setCurrentViewType(result?.[0]?.value);
	// 		}
	// 		return result;
	// 	}, [currentLib.data?.CollectionType]);

	// 	const [_videoTypesState, _setVideoTypesState] = useState<
	// 		Record<VideoType, boolean | undefined>
	// 	>({
	// 		VideoFile: undefined,
	// 		Iso: undefined,
	// 		BluRay: undefined,
	// 		Dvd: undefined,
	// 	});

	// 	const [_sortBy, setSortBy] = useState<string>("Name");
	// 	const [_sortAscending, setSortAscending] = useState(
	// 		() =>
	// 			JSON.parse(
	// 				sessionStorage.getItem(
	// 					`library-${currentLib.data?.Id}-config_sort`,
	// 				) as string,
	// 			)?.sortAscending ?? true,
	// 	);
	// 	useEffect(() => {
	// 		// I don't know why this works, don't ask...
	// 		const cachedVal = sessionStorage.getItem(
	// 			`library-${currentLib.data?.Id}-config_sort`,
	// 		) as unknown as {
	// 			sortAscending?: boolean;
	// 			sortBy?: ItemSortBy;
	// 		};
	// 		if (cachedVal?.sortAscending) {
	// 			console.log(cachedVal.sortAscending);
	// 			setSortAscending(cachedVal.sortAscending);
	// 		}
	// 	}, [currentLib.data?.Id]);
	// 	const _sortByOptions: SortByObject[] = useMemo(() => {
	// 		const result: SortByObject[] = undefined!;

	// 		const cachedVal = JSON.parse(
	// 			sessionStorage.getItem(
	// 				`library-${currentLib.data?.Id}-config_sort`,
	// 			) as string,
	// 		);
	// 		if (cachedVal) {
	// 			setSortBy(cachedVal.sortBy);
	// 		} else {
	// 			setSortBy(result?.[0]?.value);
	// 		}
	// 		return result;
	// 	}, [currentLib.data?.CollectionType, currentViewType]);

	// 	const [filters, _setFilters] = useState<Record<string, undefined | boolean>>(
	// 		() => {
	// 			const cachedVal = sessionStorage.getItem(
	// 				`library-${currentLib.data?.Id}-config_fliters`,
	// 			);
	// 			if (cachedVal !== null) {
	// 				return JSON.parse(cachedVal);
	// 			}
	// 			return {
	// 				isPlayed: false,
	// 				isUnPlayed: false,
	// 				isResumable: false,
	// 				isFavorite: false,
	// 				isLiked: false,
	// 				isUnliked: false,
	// 				hasSubtitles: false,
	// 				hasTrailer: false,
	// 				hasSpecialFeature: false,
	// 				hasThemeSong: false,
	// 				hasThemeVideo: false,
	// 				isBluRay: false,
	// 				isDVD: false,
	// 				isHD: undefined,
	// 				isSD: false,
	// 				is4K: false,
	// 				is3D: false,
	// 			};
	// 		},
	// 	);
	// 	useEffect(() => {
	// 		sessionStorage.setItem(
	// 			`library-${currentLib.data?.Id}-config_fliters`,
	// 			JSON.stringify(filters),
	// 		);
	// 	}, [filters, currentLib.data?.Id]);

	// 	// const _rowVirtualizer = useWindowVirtualizer({
	// 	// 	count: items.data?.TotalRecordCount ?? 1,
	// 	// 	estimateSize: () => 80,
	// 	// 	overscan: 4,
	// 	// });
	// 	// const onlyStatusFilterViews = ["books", "music"];

	// 	const [filterButtonAnchorEl, setFilterButtonAnchorEl] =
	// 		useState<HTMLButtonElement | null>(null);
	// 	const _filterMenuOpen = useMemo(
	// 		() => Boolean(filterButtonAnchorEl),
	// 		[filterButtonAnchorEl],
	// 	);
	// 	const _handleFilterDropdown = useCallback(
	// 		(e: MouseEvent<HTMLButtonElement>) => {
	// 			setFilterButtonAnchorEl(e.currentTarget);
	// 		},
	// 		[currentViewType, filterButtonAnchorEl],
	// 	);