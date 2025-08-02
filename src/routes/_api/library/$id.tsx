import { BaseItemKind, ItemSortBy } from "@jellyfin/sdk/lib/generated-client";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useSuspenseQuery } from "@tanstack/react-query";
import React, { Suspense } from "react";
import "./library.scss";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import LibraryItemsGrid from "@/components/libraryItemsGrid";
import LibraryMenu from "@/components/libraryMenu";
import LibraryItemsSkeleton from "@/components/skeleton/libraryItems";
import { getLibraryQueryOptions } from "@/utils/queries/library";
import { useApiInContext } from "@/utils/store/api";
import { useCentralStore } from "@/utils/store/central";

// type SortByObject = { title: string; value: string };
// type ViewObject = { title: string; value: BaseItemKind | "Artist" };
// type allowedFilters = ["movies", "tvshows", "music", "books"];

export const Route = createFileRoute("/_api/library/$id")({
	component: Library,
	validateSearch: z.object({
		sortBy: z.optional(z.enum(ItemSortBy)),
		sortAscending: z.optional(z.boolean()),
		currentViewType: z.optional(
			z.union([z.enum(BaseItemKind), z.literal("Artist")]),
		),
		filters: z.optional(
			z.object({
				isPlayed: z.optional(z.boolean()),
				isUnPlayed: z.optional(z.boolean()),
				isResumable: z.optional(z.boolean()),
				isFavorite: z.optional(z.boolean()),
				hasSubtitles: z.optional(z.boolean()),
				hasTrailer: z.optional(z.boolean()),
				hasSpecialFeature: z.optional(z.boolean()),
				hasThemeSong: z.optional(z.boolean()),
				hasThemeVideo: z.optional(z.boolean()),
				isSD: z.optional(z.boolean()),
				isHD: z.optional(z.boolean()),
				is4K: z.optional(z.boolean()),
				is3D: z.optional(z.boolean()),
			}),
		),
		videoTypesState: z.optional(
			z.object({
				BluRay: z.optional(z.boolean()),
				Dvd: z.optional(z.boolean()),
				Iso: z.optional(z.boolean()),
				VideoFile: z.optional(z.boolean()),
			}),
		),
	}),
	loaderDeps: ({ search }) => ({
		...search,
	}),
	loader: async ({
		context: { queryClient, api, user },
		params,
		deps: { ...search },
	}) => {
		if (!api || !user?.Id) return null;

		if (Object.keys(search).length > 0) {
			console.log("Using search params:", search);
			// If search is not empty, ensure the library data is fetched
			return await queryClient.ensureQueryData(
				getLibraryQueryOptions(api, user.Id, params.id),
			);
		}
		const cachedSearch = sessionStorage.getItem(`library-${params.id}-config`);
		if (cachedSearch) {
			console.log("Using cached search params:", cachedSearch);
			throw redirect({
				to: "/library/$id",
				params: { id: params.id },
				search: JSON.parse(cachedSearch),
				replace: true,
			});
		}

		// Priority 3: No params anywhere, fetch the initial type to create them
		const initialData = await queryClient.ensureQueryData(
			getLibraryQueryOptions(api, user.Id, params.id),
		);

		// Now, redirect to the URL with the new initial params
		throw redirect({
			to: "/library/$id",
			search: {
				sortAscending: true,
				sortBy: ItemSortBy.Name,
				currentViewType:
					initialData?.CollectionType === "music"
						? BaseItemKind.MusicAlbum
						: BaseItemKind.Movie,
				filters: {
					isPlayed: false,
					isUnPlayed: false,
					isResumable: false,
					isFavorite: false,
					hasSubtitles: false,
					hasTrailer: false,
					hasSpecialFeature: false,
					hasThemeSong: false,
					hasThemeVideo: false,
					isSD: false,
					isHD: undefined,
					is4K: false,
					is3D: false,
				},
				videoTypesState: {
					BluRay: false,
					Dvd: false,
					Iso: false,
					VideoFile: false,
				},
			},
			params: { id: params.id },
			replace: true,
		});
	},
});

function Library() {
	const api = useApiInContext((s) => s.api);

	const { id } = Route.useParams();

	const user = useCentralStore((s) => s.currentUser);

	const currentLib = useSuspenseQuery(
		getLibraryQueryOptions(api, user?.Id, id),
	);

	return (
		<main className="scrollY library padded-top">
			<div
				style={{
					padding: "1em 1em 1em 0.6em",
					height: "4.4em",
					zIndex: "10",
					display: "flex",
					alignItems: "center",
					justifyContent: "flex-start",
					position: "absolute",
					top: "0px",
					left: "50%",
					transform: "translate(-50%)",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						width: "fit-content",
						padding: "0 1em",
					}}
				>
					<Typography variant="h5" sx={{ mr: 2, flexShrink: 0 }} noWrap>
						{currentLib.isPending ? (
							<CircularProgress sx={{ p: 1 }} />
						) : (
							currentLib.data?.Name
						)}
					</Typography>
				</div>
			</div>
			<Suspense fallback={<LibraryItemsSkeleton />}>
				<div className="library-items">
					<LibraryMenu />
					<LibraryItemsGrid />
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