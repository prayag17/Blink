import type { BaseItemKind } from "@jellyfin/sdk/lib/generated-client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type VideoTypesState = {
	BluRay?: boolean;
	Dvd?: boolean;
	Iso?: boolean;
	VideoFile?: boolean;
};

export type FiltersState = Record<string, boolean | undefined>;

export interface LibraryStateSlice {
	currentViewType?: BaseItemKind | "Artist";
	sortBy: string; // comma joined for multi-key
	sortAscending: boolean;
	nameStartsWith?: string;
	genreIds: string[];
	filters: FiltersState;
	videoTypesState: VideoTypesState;
	libraryName?: string;
	itemsTotalCount?: number;
}

export interface LibraryStateStore {
	libraries: Record<string, LibraryStateSlice>;
	initLibrary: (
		libraryId: string,
		defaults: Partial<LibraryStateSlice>,
	) => void;
	updateLibrary: (
		libraryId: string,
		partial: Partial<LibraryStateSlice>,
	) => void;
	resetLibrary: (libraryId: string) => void;
}

const defaultSlice: LibraryStateSlice = {
	currentViewType: undefined,
	sortBy: "Name",
	sortAscending: true,
	nameStartsWith: undefined,
	genreIds: [],
	filters: {},
	videoTypesState: {},
	libraryName: undefined,
	itemsTotalCount: undefined,
};

export const useLibraryStateStore = create<LibraryStateStore>()(
	persist(
		(set) => ({
			libraries: {},
			initLibrary: (libraryId, defaults) =>
				set((s) => {
					if (s.libraries[libraryId]) return s; // already initialized
					return {
						libraries: {
							...s.libraries,
							[libraryId]: { ...defaultSlice, ...defaults },
						},
					};
				}),
			updateLibrary: (libraryId, partial) =>
				set((s) => ({
					libraries: {
						...s.libraries,
						[libraryId]: {
							...(s.libraries[libraryId] || defaultSlice),
							...partial,
						},
					},
				})),
			resetLibrary: (libraryId) =>
				set((s) => ({
					libraries: { ...s.libraries, [libraryId]: { ...defaultSlice } },
				})),
		}),
		{
			name: "blink-library-state",
			storage: createJSONStorage(() => sessionStorage),
			partialize: (state) => ({ libraries: state.libraries }),
			version: 1,
		},
	),
);
