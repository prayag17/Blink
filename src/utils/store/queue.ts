import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import { create } from "zustand";

interface QueueStore {
	tracks: BaseItemDto[];
	currentItemIndex: number;
}

const useQueue = create<QueueStore>(() => ({
	tracks: [],
	currentItemIndex: 0,
}));

export const setQueue = (
	tracks: BaseItemDto[] | undefined,
	currentItemIndex: number,
) => {
	useQueue.setState(() => ({ tracks, currentItemIndex }));
};

export const setTrackIndex = (index: number) => {
	console.info(`Setting index ${index}`);
	useQueue.setState((state) => ({ ...state, currentItemIndex: index }));
};

export default useQueue;
