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