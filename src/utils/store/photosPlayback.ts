import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import { immer } from "zustand/middleware/immer";
import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";

type PhotosPlaybackStore = {
	photos: BaseItemDto[] | null;
	index: number;
	playPhotos: (photos: BaseItemDto[], index: number) => void;
};


export const usePhotosPlayback = createWithEqualityFn<PhotosPlaybackStore>()(
	immer((set) => ({
		photos: null,
		playPhotos: (photos, index) =>
			set((state) => {
				state.photos = photos;
				state.index = index;
			}),
		index: 0,
	})),
	shallow,
);