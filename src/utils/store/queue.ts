import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";

interface QueueStore {
	tracks: BaseItemDto[] | undefined;
	/**
	 * This index number should be equal to index of the item in tracks array to allow seamless playback of items having broken IndexNumber field.
	 */
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

export const reorderQueue = (newOrder: BaseItemDto[]) => {
	useQueue.setState((state) => ({ ...state, tracks: newOrder }));
};

export const removeFromQueue = (index: number) => {
	useQueue.setState((state) => {
		if (!state.tracks) return state;
		const newTracks = [...state.tracks];
		newTracks.splice(index, 1);

		let newIndex = state.currentItemIndex;
		if (index < state.currentItemIndex) {
			newIndex--;
		} else if (index === state.currentItemIndex) {
			// If removing current item, ensure index is valid
			if (newIndex >= newTracks.length) {
				newIndex = Math.max(0, newTracks.length - 1);
			}
		}

		return { ...state, tracks: newTracks, currentItemIndex: newIndex };
	});
};

export const clearUpcoming = () => {
	useQueue.setState((state) => {
		if (!state.tracks) return state;
		// Keep only items up to and including the current item
		const newTracks = state.tracks.slice(0, state.currentItemIndex + 1);
		return { ...state, tracks: newTracks };
	});
};

export const shuffleUpcoming = () => {
	useQueue.setState((state) => {
		if (!state.tracks || state.tracks.length <= state.currentItemIndex + 1)
			return state;

		const currentItems = state.tracks.slice(0, state.currentItemIndex + 1);
		const upcomingItems = state.tracks.slice(state.currentItemIndex + 1);

		// Fisher-Yates shuffle for upcoming items
		for (let i = upcomingItems.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[upcomingItems[i], upcomingItems[j]] = [
				upcomingItems[j],
				upcomingItems[i],
			];
		}

		return { ...state, tracks: [...currentItems, ...upcomingItems] };
	});
};

/**
 * Resets the Queue store
 */
export const clearQueue = () => {
	useQueue.setState(useQueue.getInitialState());
};

export default useQueue;
