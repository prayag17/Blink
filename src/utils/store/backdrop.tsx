import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";

type BackdropStore = {
	backdropUrl: string;
	backdropId: string;
	setBackdrop: (url: string | undefined, id: string | undefined) => void;
};

export const useBackdropStore = createWithEqualityFn<BackdropStore>(
	(set) => ({
		backdropUrl: "",
		backdropId: "",
		setBackdrop: (url, id) => set(() => ({ backdropUrl: url, backdropId: id })),
	}),
	shallow,
);

/**
 * @deprecated Please use setBackdrop method from the store
 */
export const setBackdrop = () => {
	// useBackdropStore.setState(() => ({ backdropUrl: url, backdropId: id }));
};
