import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";
import { usePlaybackStore } from "./playback";

type PhotosPlaybackStore = {
	photos: BaseItemDto[] | null;
	index: number;
	playPhotos: (photos: BaseItemDto[], index: number) => void;
};

type PhotosPlaybackStoreActions = {
	playPhotos: (photos: BaseItemDto[]) => void;
};

export const usePhotosPlayback = createWithEqualityFn<PhotosPlaybackStore>()(
	devtools(
		immer((set) => ({
			photos: null,
			playPhotos: (photos, index) =>
				set((state) => {
					state.photos = photos;
					state.index = index;
				}),
			index: 0,
		})),
	),
	shallow,
);