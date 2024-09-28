import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";

interface QueueStore {
	tracks: BaseItemDto[];
	currentItemIndex: number;
}

const useQueue = createWithEqualityFn<QueueStore>(
	() => ({
		tracks: [],
		currentItemIndex: 0,
	}),
	shallow,
);

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


/**
 * Resets the Queue store
 */
export const clearQueue = () => {
	useQueue.setState(useQueue.getInitialState());
};

export default useQueue;
