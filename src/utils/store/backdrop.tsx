import { createStore } from "zustand";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";

type BackdropStore = {
	backdropUrl: string;
	backdropId: string;
	setBackdrop: (
		url: string | undefined | null,
		id: string | undefined | null,
	) => void;
};

export const backdropStore = createStore((set) => ({
	backdropUrl: "",
	backdropId: "",
	setBackdrop: (
		url: string | undefined | null,
		id: string | undefined | null,
	) => set(() => ({ backdropUrl: url, backdropId: id })),
}));

export function useBackdropStore<T>(selector?: (state: BackdropStore) => T) {
	return useStoreWithEqualityFn(backdropStore, selector!, shallow);
}
/**
 * @deprecated Please use setBackdrop method from the store
 */
export const setBackdrop = () => {
	// useBackdropStore.setState(() => ({ backdropUrl: url, backdropId: id }));
};
